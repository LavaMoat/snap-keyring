import SnapKeyring, { SerializedWallets } from ".";

const missingPublicKey = Buffer.from(
  "00adbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  "hex"
);

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
  ],
};

const publicKey = Buffer.from(mockWallets[mockSnapOrigin][0][0], "hex");

test("Should manage wallets", async () => {
  const keyring = new SnapKeyring();

  // Trigger some code paths for non-existent
  // snap origin for coverage
  keyring.listAccounts(mockSnapOrigin);
  keyring.readAccount(mockSnapOrigin, publicKey);
  keyring.updateAccount(mockSnapOrigin, publicKey, null);
  keyring.createAccount(mockSnapOrigin, publicKey, null);
  keyring.deleteAccount(mockSnapOrigin, publicKey);

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
  const added = keyring.createAccount(
    mockSnapOrigin,
    publicKey,
    mockSnapPrivateData
  );
  expect(added).toEqual(true);

  const accountPublicKeys = keyring.listAccounts(mockSnapOrigin);
  expect(accountPublicKeys).toEqual([publicKey]);

  const duplicateAdded = keyring.createAccount(mockSnapOrigin, publicKey, {
    secret: "super secret",
  });
  expect(duplicateAdded).toEqual(false);

  const readPrivateData = keyring.readAccount(mockSnapOrigin, publicKey);
  expect(readPrivateData).toEqual(mockSnapPrivateData);

  const mockUpdatedData = { secret: "new value" };
  const updatedPrivateData = keyring.updateAccount(
    mockSnapOrigin,
    publicKey,
    mockUpdatedData
  );
  expect(updatedPrivateData).toEqual(true);

  const missingUpdatedPrivateData = keyring.updateAccount(
    mockSnapOrigin,
    missingPublicKey,
    mockUpdatedData
  );
  expect(missingUpdatedPrivateData).toEqual(false);

  const deletedAccount = keyring.deleteAccount(mockSnapOrigin, publicKey);
  expect(deletedAccount).toEqual(mockAddress);

  const deleteNonExistent = keyring.deleteAccount(mockSnapOrigin, publicKey);
  expect(deleteNonExistent).toEqual(null);

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
