import SnapKeyring, { SerializedWallets } from ".";
import { Json } from "@metamask/utils";

const mockSnapOrigin = "https://mock-snap.example.com";
const mockAddress = "0x77ac616693b24c0c49cb148dbcb3fac8ccf0c96c";
const mockPrivateData = {
  mockPrivateData: "foo",
};
const mockWallets: SerializedWallets = {
  [mockSnapOrigin]: [
    [
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      mockPrivateData,
    ],
  ]
};

test("Should manage wallets", async () => {
  const keyring = new SnapKeyring();

  const noAccounts = await keyring.getAccounts();
  expect(noAccounts).toEqual([]);

  await keyring.deserialize(mockWallets);

  const serialized = await keyring.serialize();
  expect(serialized).toEqual(mockWallets);

  const accounts = await keyring.getAccounts();
  expect(accounts).toEqual([mockAddress]);

  const [, privateData] = keyring.exportAccount(mockAddress);
  expect(privateData).toEqual(mockPrivateData);

  const missingData = keyring.exportAccount("0xff");
  expect(missingData).toBeUndefined();

  const removed = keyring.removeAccount(mockAddress);
  expect(removed).toEqual(true);

  const emptyAccounts = await keyring.getAccounts();
  expect(emptyAccounts).toEqual([]);

  const removedEmpty = keyring.removeAccount(mockAddress);
  expect(removedEmpty).toEqual(false);

  const mockSnapPrivateData = { secret: "super secret" };
  const publicKey = Buffer.from(mockWallets[mockSnapOrigin][0][0], "hex");
  const added = keyring.createAccount(mockSnapOrigin, publicKey, mockSnapPrivateData);
  expect(added).toEqual(true);

  const duplicateAdded = keyring.createAccount(mockSnapOrigin, publicKey, {
    secret: "super secret",
  });
  expect(duplicateAdded).toEqual(false);

  const readPrivateData = keyring.readAccount(mockSnapOrigin, publicKey);
  expect(readPrivateData).toEqual(mockSnapPrivateData);

  try {
    await keyring.signMessage();
  } catch (e) {
    expect(e.message).toMatch("not supported");
  }

  try {
    await keyring.signTransaction();
  } catch (e) {
    expect(e.message).toMatch("not supported");
  }
});
