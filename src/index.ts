/**
 *  Keyring that stores arbitrary JSON private data.
 *
 *  Each account requires a public key (64 byte or 33 byte SEC-1 encoded)
 *  and some arbitrary private data that must be serializable to JSON.
 */
import { Json } from "@metamask/utils";
import { publicToAddress, stripHexPrefix, bufferToHex } from "ethereumjs-util";

export const type = "Snap Keyring";

export type Origin = string; // Origin of the snap
export type Address = string; // String public address
export type PublicKey = Buffer; // 33 or 64 byte public key
export type JsonWallet = [PublicKey, Json];
export type SnapWallet = Map<Origin, JsonWallet[]>;

// Type for serialized format.
export type SerializedWallets = {
  [key: string]: [string, Json][];
};

class SnapKeyring {
  static type: string;
  type: string;
  _wallets: SnapWallet;

  constructor() {
    this.type = type;
    this._wallets = new Map();
  }

  _publicKeyToAddress(publicKey: PublicKey): Address {
    return bufferToHex(publicToAddress(publicKey));
  }

  /**
   *  Convert the wallets in this keyring to a serialized form
   *  suitable for persistence.
   *
   *  This function is synchronous but uses an async signature
   *  for consistency with other keyring implementations.
   */
  async serialize(): Promise<SerializedWallets> {
    const output: SerializedWallets = {};
    for (const [origin, accounts] of this._wallets.entries()) {
      output[origin] = accounts.map((wallet: JsonWallet) => {
        const [publicKey, privateValue] = wallet;
        return [publicKey.toString("hex"), privateValue];
      });
    }
    return output;
  }

  /**
   *  Deserialize the given wallets into this keyring.
   *
   *  This function is synchronous but uses an async signature
   *  for consistency with other keyring implementations.
   */
  async deserialize(wallets: SerializedWallets): Promise<void> {
    for (const [key, accounts] of Object.entries(wallets)) {
      this._wallets.set(
        key,
        accounts.map((value: [string, Json]) => {
          const [publicKey, privateValue] = value;
          return [Buffer.from(publicKey, "hex"), privateValue];
        })
      );
    }
  }

  /**
   *  Get an array of public addresses.
   */
  async getAccounts(): Promise<Address[]> {
    let addresses: Address[] = [];
    for (const [, wallets] of this._wallets.entries()) {
      addresses = addresses.concat(
        wallets.map((value: JsonWallet) => {
          const [publicKey] = value;
          return this._publicKeyToAddress(publicKey);
        })
      );
    }
    return addresses;
  }

  /**
   *  Sign a transaction.
   */
  async signTransaction(/* address, tx, opts = {} */) {
    // istanbul ignore next
    throw new Error("signTransaction is not supported for the snap keyring");
  }

  /**
   *  Sign a message.
   */
  async signMessage(/* address, data, opts = {} */) {
    // istanbul ignore next
    throw new Error("signMessage is not supported for the snap keyring");
  }

  /**
   *  Gets the private data associated with the given address so
   *  that it may be exported.
   *
   *  If this keyring contains duplicate public keys the first
   *  matching address is exported.
   *
   *  Used by the UI to export an account.
   */
  exportAccount(address: Address): [PublicKey, Json] | undefined {
    const normalizedAddress = stripHexPrefix(address);
    for (const [, accounts] of this._wallets.entries()) {
      const matchedAccount = accounts.find((wallet: JsonWallet) => {
        const [publicKey] = wallet;
        const walletAddress = stripHexPrefix(
          this._publicKeyToAddress(publicKey)
        );
        return normalizedAddress === walletAddress;
      });
      if (matchedAccount) {
        return matchedAccount;
      }
    }
  }

  /**
   *  Removes the first account matching the given public address.
   */
  removeAccount(address: Address): boolean {
    const normalizedAddress = stripHexPrefix(address);
    for (const [origin, accounts] of this._wallets.entries()) {
      const filtered = accounts.filter((wallet: JsonWallet) => {
        const [publicKey] = wallet;
        const walletAddress = stripHexPrefix(
          this._publicKeyToAddress(publicKey)
        );
        return normalizedAddress !== walletAddress;
      });

      if (filtered.length !== accounts.length) {
        this._wallets.set(origin, filtered);
        return true;
      }
    }
    return false;
  }

  /**
   *  Create an account for a snap origin.
   *
   *  The account is only created if the public address does not
   *  already exist.
   *
   *  This checks for duplicates in the context of the snap origin but
   *  not across all snaps. The keyring controller is responsible for checking
   *  for duplicates across all addresses.
   */
  createAccount(origin: Origin, publicKey: PublicKey, value: Json): boolean {
    const wallets = this._wallets.get(origin) || [];
    const exists = wallets.find((v) => v[0] === publicKey);
    if (!exists) {
      wallets.push([publicKey, value]);
      this._wallets.set(origin, wallets);
      return true;
    }
    return false;
  }

  /**
   *  Read an account for a snap origin.
   */
  readAccount(origin: Origin, publicKey: PublicKey): Json | undefined {
    const wallets = this._wallets.get(origin) || [];
    const value = wallets.find((v) => v[0] === publicKey);
    if (value) {
      const [, privateData] = value;
      return privateData;
    }
  }

}

SnapKeyring.type = type;

export default SnapKeyring;
