import JsonKeyring from ".";
import { Json } from "@metamask/utils";

const mockAddress = "0x77ac616693b24c0c49cb148dbcb3fac8ccf0c96c";
const mockPrivateData = {
  mockPrivateData: "foo",
};
const mockWallets: [string, Json][] = [
  [
    "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    mockPrivateData,
  ],
];

test("Should manage wallets", async () => {
  const keyring = new JsonKeyring();

  const noAccounts = keyring.getAccounts();
  expect(noAccounts).toEqual([]);

  await keyring.deserialize(mockWallets);

  const serialized = await keyring.serialize();
  expect(serialized).toEqual(mockWallets);

  const accounts = keyring.getAccounts();
  expect(accounts).toEqual([mockAddress]);

  const [,privateData] = keyring.exportAccount(mockAddress);
  expect(privateData).toEqual(mockPrivateData);

  const missingData = keyring.exportAccount("0xff");
  expect(missingData).toBeUndefined();

  const removed = keyring.removeAccount(mockAddress);
  expect(removed).toEqual(true);

  const emptyAccounts = keyring.getAccounts();
  expect(emptyAccounts).toEqual([]);

  const removedEmpty = keyring.removeAccount(mockAddress);
  expect(removedEmpty).toEqual(false);

  try {
    await keyring.signMessage();
  } catch (e) {
    expect(e.message).toMatch("TODO");
  }

  try {
    await keyring.signTransaction();
  } catch (e) {
    expect(e.message).toMatch("TODO");
  }
});
