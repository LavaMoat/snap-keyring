/**
 *  Keyring that stores arbitrary JSON private data.
 *
 *  Each account requires a public key (64 byte or 33 byte SEC-1 encoded)
 *  and some arbitrary private data that must be serializable to JSON.
 */
import { Json } from "@metamask/utils";
import { publicToAddress, stripHexPrefix, bufferToHex } from "ethereumjs-util";

export const type = "Snap Keyring";

export type Address = string;
export type PublicKey = Buffer; // 33 or 64 byte public key
export type JsonWallet = [PublicKey, Json];

// Type for serialized format.
type JsonWallets = [string, Json][];

class SnapKeyring {
  // MM build system cannot accept static or other class members
  static type: string;
  type: string;
  _wallets: JsonWallet[];

  constructor() {
    this.type = type;
    this._wallets = [];
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
  async serialize(): Promise<JsonWallets> {
    return this._wallets.map((wallet: JsonWallet) => {
      const [publicKey, privateValue] = wallet;
      return [publicKey.toString("hex"), privateValue];
    });
  }

  /**
   *  Deserialize the given wallets into this keyring.
   *
   *  This function is synchronous but uses an async signature
   *  for consistency with other keyring implementations.
   */
  async deserialize(wallets: JsonWallets): Promise<void> {
    this._wallets = wallets.map((value: [string, Json]) => {
      const [publicKey, privateValue] = value;
      return [Buffer.from(publicKey, "hex"), privateValue];
    });
  }

  /**
   *  Get an array of public addresses.
   */
  async getAccounts(): Promise<Address[]> {
    return this._wallets.map((wallet: JsonWallet) => {
      const [publicKey] = wallet;
      return this._publicKeyToAddress(publicKey);
    });
  }

  // Called by the snap to create an account.
  addAccount(publicKey: PublicKey, value: Json): boolean {
    const exists = this._wallets.find((v) => v[0] === publicKey);
    if (!exists) {
      this._wallets.push([publicKey, value]);
      return true;
    }
    return false;
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
   *  Gets the private data associated with the public key.
   */
  exportAccount(address: Address): [PublicKey, Json] | undefined {
    const normalizedAddress = stripHexPrefix(address);
    return this._wallets.find((wallet: JsonWallet) => {
      const [publicKey] = wallet;
      const walletAddress = stripHexPrefix(this._publicKeyToAddress(publicKey));
      return normalizedAddress === walletAddress;
    });
  }

  /**
   *  Remove an account for the given public address.
   */
  removeAccount(address: Address): boolean {
    const normalizedAddress = stripHexPrefix(address);
    const initialLength = this._wallets.length;
    this._wallets = this._wallets.filter((wallet: JsonWallet) => {
      const [publicKey] = wallet;
      const walletAddress = stripHexPrefix(this._publicKeyToAddress(publicKey));
      return normalizedAddress !== walletAddress;
    });
    return this._wallets.length < initialLength;
  }
}

SnapKeyring.type = type;

export default SnapKeyring;
