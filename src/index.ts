/**
 *  Keyring that stores private data partitioned by snap.
 *
 *  Each account requires a 64 byte public key and some arbitrary private
 *  data that must be serializable to JSON.
 *
 *  Consumers of the API use an Ethereum address to reference accounts.
 */
import { Json } from "@metamask/utils";
import { publicToAddress, stripHexPrefix } from "ethereumjs-util";
import { normalize } from "@metamask/eth-sig-util";

export const type = "Snap Keyring";

export type Address = string;
export type SnapId = string;
export type Origin = string;
export type PublicKey = Buffer; // 32 byte public key
export type SnapKey = [SnapId, Origin];
export type SnapWallet = Map<PublicKey, Json>;
// We have to store the `SnapKey` as a string otherwise
// Map operations will fail due to Array equality.
export type SnapWallets = Map<string, SnapWallet>;

// Serialized format.
//
// The key tuple is joined separated by a single space and the
// public key for each account is encoded as a hex string.
type JsonWallets = {
  [key: string]: Json;
};

class SnapKeyring {
  static type: string;

  type: string;
  #wallets: SnapWallets;

  constructor() {
    this.type = type;
    this.#wallets = new Map();
  }

  #serializeKey(key: SnapKey): string {
    return `${key[0]} ${key[1]}`;
  }

  #publicKeyToAddress(publicKey: PublicKey): Address {
    return normalize(publicToAddress(publicKey).toString("hex"));
  }

  /**
   *  Convert the wallets in this keyring to a serialized form
   *  suitable for persistence.
   *
   *  This function is synchronous but uses an async signature
   *  for consistency with other keyring implementations.
   */
  async serialize(): Promise<JsonWallets> {
    const toPublicKeyHex = (wallet: SnapWallet): Json => {
      const result: Json = {};
      for (const [key, value] of wallet.entries()) {
        result[key.toString("hex")] = value;
      }
      return result;
    };
    const result: JsonWallets = {};
    for (const [key, value] of this.#wallets.entries()) {
      result[key] = toPublicKeyHex(value);
    }
    return result;
  }

  /**
   *  Deserialize the given wallets into this keyring.
   *
   *  This function is synchronous but uses an async signature
   *  for consistency with other keyring implementations.
   */
  async deserialize(wallets: JsonWallets): Promise<void> {
    const fromPublicKeyHex = (
      dict: { [key: string]: Json },
      wallet: SnapWallet
    ) => {
      for (const key in dict) {
        const privateData: Json = dict[key];
        const publicKey = Buffer.from(key, "hex");
        wallet.set(publicKey, privateData);
      }
    };

    for (const key in wallets) {
      const value = wallets[key] as { [key: string]: Json };
      const snapWallet: SnapWallet = new Map();
      fromPublicKeyHex(value, snapWallet);
      this.#wallets.set(key, snapWallet);
    }
  }

  /**
   *  Get an array of addresses in the given wallet for a snap.
   */
  getAccounts(key: SnapKey): Address[] {
    const wallet = this.#wallets.get(this.#serializeKey(key));
    if (wallet) {
      return Array.from(wallet.keys()).map((key: PublicKey) => {
        return this.#publicKeyToAddress(key);
      });
    }
    return [];
  }

  /**
   *  Sign a transaction.
   */
  async signTransaction(/* address, tx, opts = {} */) {
    // istanbul ignore next
    throw new Error("TODO: send RPC response to the snap");
  }

  /**
   *  Sign a message.
   */
  async signMessage(/* address, data, opts = {} */) {
    // istanbul ignore next
    throw new Error("TODO: send RPC response to the snap");
  }

  /**
   *  Gets the private data associated with the public key for a snap.
   */
  exportAccount(key: SnapKey, address: Address): Json {
    const normalizedAddress = stripHexPrefix(address);
    const wallet = this.#wallets.get(this.#serializeKey(key));
    if (wallet) {
      for (const [key, value] of wallet.entries()) {
        const walletAddress = stripHexPrefix(this.#publicKeyToAddress(key));
        if (walletAddress === normalizedAddress) {
          return value;
        }
      }
    }
    return null;
  }

  /**
   *  Remove an account for the given snap and public address.
   */
  removeAccount(key: SnapKey, address: Address): boolean {
    const normalizedAddress = stripHexPrefix(address);
    const wallet = this.#wallets.get(this.#serializeKey(key));
    if (wallet) {
      for (const key of wallet.keys()) {
        const walletAddress = stripHexPrefix(this.#publicKeyToAddress(key));
        if (walletAddress === normalizedAddress) {
          wallet.delete(key);
          return true;
        }
      }
    }
    return false;
  }
}

SnapKeyring.type = type;

export default SnapKeyring;
