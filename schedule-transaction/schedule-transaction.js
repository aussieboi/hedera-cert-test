const {
  PrivateKey,
  Transaction,
  TransferTransaction,
  Hbar,
  ScheduleCreateTransaction,
  Client
} = require("@hashgraph/sdk")
const dotenv =  require('dotenv')
const { resolve } = require('path')

dotenv.config({path: resolve(__dirname, "../.env")})


// Account 1 private key and account id
const account1PrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY_1)
const account1ID = process.env.ACCOUNT_ID_1

// Account 2 private key and account id
const account2PrivateKey = PrivateKey.fromString(process.env.PRIVATE_KEY_2)
const account2ID = process.env.ACCOUNT_ID_2

// throw error if acconut ids or private keys don't exist
if (!account1PrivateKey || !account1ID || !account2PrivateKey || !account2ID) {
  throw new Error('Environment variables for Account1 and Account2 must be set.');
}

const client = Client.forTestnet();
client.setOperator(account1ID, account1PrivateKey);

async function scheduleTransaction(from, to, amount, fromPrivateKey) {
  // Account 1 transfers 10 hbars to Account 2
  const trx = new TransferTransaction()
      .addHbarTransfer(from, new Hbar(`-${amount}`))
      .addHbarTransfer(to, new Hbar(amount));

  // create schedule transaction from transfer transaction
  const txBytes = new ScheduleCreateTransaction()
      .setScheduledTransaction(trx)
      .setAdminKey(fromPrivateKey)
      .freezeWith(client)
      .toBytes();

  // convert to base64 string
  const base64Trx = Buffer.from(txBytes).toString('base64');
  console.log(`Base64 trx: ${base64Trx}`)
  return base64Trx
}

async function deserializeTransaction(base64Tx) {
  // create transaction from bytes
  const trx = await Transaction.fromBytes(Buffer.from(base64Tx, 'base64'))
      .sign(account1PrivateKey);

  // execute transaction
  await trx.execute(client)
  console.log(`\nTransaction ID: ${trx.transactionId}`)
}

async function main() {
  const serializedTx = await scheduleTransaction(account1ID, account2ID, 10, account1PrivateKey);
  await deserializeTransaction(serializedTx);
  process.exit()
}

main()
