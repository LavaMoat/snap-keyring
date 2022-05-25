import SnapKeyring, { SnapKey } from ".";

const mockSnapId = "local:http://localhost:8080";
const mockSnapOrigin = "localhost:8080";
const mockSnapKey = [mockSnapId, mockSnapOrigin] as SnapKey;
const missingSnapKey = ['local:http://mock.test', 'mock.test'] as SnapKey;
const mockAddress = "0x77ac616693b24c0c49cb148dbcb3fac8ccf0c96c";
const mockPrivateData = {
  mockPrivateData: "foo",
};

const mockWallets = {
  "local:http://localhost:8080 localhost:8080": {
    deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef: mockPrivateData,
  },
};

test("Should manage wallets", async () => {
  const keyring = new SnapKeyring();
  await keyring.deserialize(mockWallets);

  const serialized = await keyring.serialize();
  expect(serialized).toEqual(mockWallets);

  const noAccounts = keyring.getAccounts(missingSnapKey);
  expect(noAccounts).toEqual([])

  const accounts = keyring.getAccounts(mockSnapKey);
  expect(accounts).toEqual([mockAddress])

  const privateData = keyring.exportAccount(mockSnapKey, mockAddress);
  expect(privateData).toEqual(mockPrivateData);

  const missingData = keyring.exportAccount(mockSnapKey, "0xff");
  expect(missingData).toBeNull();

  const removed = keyring.removeAccount(mockSnapKey, mockAddress);
  expect(removed).toEqual(true);

  const emptyAccounts = keyring.getAccounts(mockSnapKey);
  expect(emptyAccounts).toEqual([])

  const removedEmpty = keyring.removeAccount(mockSnapKey, mockAddress);
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
