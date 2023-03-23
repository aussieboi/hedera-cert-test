const {
  Client,
  Hbar,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractFunctionParameters,
} = require("@hashgraph/sdk");
const dotenv = require('dotenv')

const { resolve } = require('path')

dotenv.config({path: resolve(__dirname, "../.env")})

const account1PrivateKey = process.env.PRIVATE_KEY_1;
const account1ID = process.env.ACCOUNT_ID_1;

if (!account1ID || !account1PrivateKey) {
  throw new Error('Environment variables ACCOUNT_ID_1 and PRIVATE_KEY_1 must be set');
}

const client = Client.forTestnet();
client.setOperator(account1ID, account1PrivateKey);

client.setDefaultMaxTransactionFee(new Hbar(100));

const contractJson = require("./CertificationC1.json");

async function deployContract() {
  const contractTrx = await new ContractCreateFlow()
      .setBytecode(contractJson.bytecode)
      .setGas(100_000)
      .execute(client);
 
  return (await contractTrx.getReceipt(client)).contractId;
}

async function interactWithContractFunction1(contractId) {
  const trx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("function1", new ContractFunctionParameters().addUint16(4).addUint16(3))
      .execute(client);
  
  let record = await trx.getRecord(client);

  return Buffer.from((record).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function interactWithContractFunction2(contractId, n) {
  const trx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100_000)
      .setFunction("function2", new ContractFunctionParameters().addUint16(n))
      .execute(client);
    
  return Buffer.from((await trx.getRecord(client)).contractFunctionResult.bytes).toJSON().data.at(-1)
}

async function main() {
  let contractId = await deployContract();
  console.log("contractId", `0.0.${contractId.num}`)
  let resultF1 = await interactWithContractFunction1(contractId);
  let resultF2 = await interactWithContractFunction2(contractId, resultF1);
  console.log("resultF2", resultF2)

  process.exit()
}

main()
