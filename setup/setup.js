const { AccountCreateTransaction, Client, PrivateKey, Hbar } = require('@hashgraph/sdk');
const dotenv = require('dotenv')
const { resolve } = require('path')

dotenv.config({path: resolve(__dirname, "../.env")})

const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = process.env.MY_PRIVATE_KEY;

if (!myAccountId || !myPrivateKey) {
    throw new Error('Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present');
}

async function main() {
  

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    for (let i = 1; i <= 5; i++) {
        const newAccountPrivateKey = PrivateKey.generateED25519();
        const newAccountPublicKey = newAccountPrivateKey.publicKey;

        const newAccount = await new AccountCreateTransaction()
            .setKey(newAccountPublicKey)
            .setInitialBalance(new Hbar(700))
            .execute(client);

        const getReceipt = await newAccount.getReceipt(client);
        const newAccountId = getReceipt.accountId;

        console.log(`ACCOUNT_ID_${i} = ${newAccountId.toString()}`);
        console.log(`PUBLIC_KEY_${i} = ${newAccountPublicKey.toString()}`);
        console.log(`PRIVATE_KEY_${i} = ${newAccountPrivateKey.toString()}`);
        console.log('\n')
    }

    process.exit();
}

main();
