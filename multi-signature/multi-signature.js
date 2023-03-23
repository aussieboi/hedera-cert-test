const { Client, TransferTransaction, KeyList, AccountCreateTransaction, Hbar, PrivateKey, AccountBalanceQuery } = require('@hashgraph/sdk');
const dotenv = require('dotenv')
const { resolve } = require('path')

dotenv.config({path: resolve(__dirname, "../.env")})

async function createNewWallet(accounts, client) {
	const thresholdKeys = new KeyList(accounts, 2);
    
	const newAccount = await new AccountCreateTransaction()
		.setKey(thresholdKeys)
		.setInitialBalance(new Hbar(20))
		.execute(client);
    
	const getReceipt = await newAccount.getReceipt(client);
	const newAccountId = getReceipt.accountId;

	console.log("The new account info : ", newAccountId.toString());

    return newAccountId;
}

async function transferFail(multiSignAccountId, fourthAccountId, privateKey1, client) {
    try {
        const tx = await (await new TransferTransaction()
        .addHbarTransfer(multiSignAccountId, new Hbar(-10))
        .addHbarTransfer(fourthAccountId, new Hbar(10))
        .freezeWith(client)
        .sign(privateKey1))
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log('Transaction status is: ', receipt.status.toString());
    } catch (error) {
        console.log('Transaction failed: signature threshold not reached')
        return;
    }
}

async function transferWithMultiSig(multiSignAccountId, fourthAccountId, privateKey1, privateKey2, client) {
    const tx = await ( await (await new TransferTransaction()
        .addHbarTransfer(multiSignAccountId, new Hbar(-10))
        .addHbarTransfer(fourthAccountId, new Hbar(10))
        .freezeWith(client)
        .sign(privateKey1))
        .sign(privateKey2))
        .execute(client);

    const receipt = await tx.getReceipt(client);
    console.log('Transaction status: ', receipt.status.toString());
}

async function printBalance(newAccountId, fourthAccountId, client) {
    const getMultiple = new AccountBalanceQuery().setAccountId(newAccountId);
    const queryOther = new AccountBalanceQuery().setAccountId(fourthAccountId);
    const accountBalanceMultiple = await getMultiple.execute(client);
    const accountBalanceOther = await queryOther.execute(client);
    
    console.log(
        `Multiple account balance ${accountBalanceMultiple.hbars} HBar, other account balance ${accountBalanceOther.hbars}`
      );
}

async function main() {
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    const privateKey1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);
    const privateKey2 = PrivateKey.fromString(process.env.PRIVATE_KEY_2);
    const privateKey3 = PrivateKey.fromString(process.env.PRIVATE_KEY_3);
    const fourthAccountId = process.env.ACCOUNT_ID_4;
    
    const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

    const newAccountId = await createNewWallet([privateKey1.publicKey, privateKey2.publicKey, privateKey3.publicKey], client);
    
    await printBalance(newAccountId, fourthAccountId, client);

    // This should fail because the threshold is not reached.
    await transferFail(newAccountId, fourthAccountId, privateKey1, client);

    await printBalance(newAccountId, fourthAccountId, client);

    // This should succeed because the threshold is reached.
    await transferWithMultiSig(newAccountId, fourthAccountId, privateKey1, privateKey2, client);

    await printBalance(newAccountId, fourthAccountId, client);

    process.exit();
}

main().catch((error) => console.log('ERROR', error));
