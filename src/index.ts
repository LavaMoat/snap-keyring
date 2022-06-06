/**
 *  Keyring that stores arbitrary JSON private data.
 *
 *  Each account requires a public key (64 byte or 33 byte SEC-1 encoded)
 *  and some arbitrary private data that must be serializable to JSON.
 *
 *  Consumers of the API use an Ethereum address to reference accounts.
 */
import { Json } from "@metamask/utils";
import { publicToAddress, stripHexPrefix } from "ethereumjs-util";
import { normalize } from "@metamask/eth-sig-util";

export const type = "Snap Keyring";

export type Address = string;
export type PublicKey = Buffer; // 33 or 64 byte public key
export type JsonWallet = [PublicKey, Json];

// Type for serialized format.
type JsonWallets = [string, Json][];

class SnapKeyring {
  // MM build system cannot accept static or other class members
  // static type;
  //type: string;
  //_wallets: JsonWallet[];

  constructor() {
    // @ts-ignore
    this.type = type;
    // @ts-ignore
    this._wallets = [];
  }

  _publicKeyToAddress(publicKey: PublicKey): Address {
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
    // @ts-ignore
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
    // @ts-ignore
    this._wallets = wallets.map((value: [string, Json]) => {
      const [publicKey, privateValue] = value;
      return [Buffer.from(publicKey, "hex"), privateValue];
    });
  }

  /**
   *  Get an array of public addresses.
   */
  async getAccounts(): Promise<Address[]> {
    // @ts-ignore
    return this._wallets.map((wallet: JsonWallet) => {
      const [publicKey] = wallet;
      return this._publicKeyToAddress(publicKey);
    });
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
    // @ts-ignore
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
    // @ts-ignore
    const initialLength = this._wallets.length;
    // @ts-ignore
    this._wallets = this._wallets.filter((wallet: JsonWallet) => {
      const [publicKey] = wallet;
      const walletAddress = stripHexPrefix(this._publicKeyToAddress(publicKey));
      return normalizedAddress !== walletAddress;
    });
    // @ts-ignore
    return this._wallets.length < initialLength;
  }
}

// @ts-ignore: can't declare static `type` field with the MM build system
SnapKeyring.type = type;

export default SnapKeyring;
