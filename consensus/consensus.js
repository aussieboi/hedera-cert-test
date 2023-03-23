const {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery
}  = require("@hashgraph/sdk");
const dotenv = require("dotenv");
const { resolve } = require('path')

dotenv.config({path: resolve(__dirname, "../.env")})

const accountId1 = process.env.ACCOUNT_ID_1;
const privateKey1 = PrivateKey.fromString(process.env.PRIVATE_KEY_1);

if (!accountId1 || !privateKey1) {
  throw new Error('Environment variables ACCOUNT_ID_1 and PRIVATE_KEY_1 must be present');
}


async function main() {
  const client = Client.forTestnet();
  client.setOperator(accountId1, privateKey1);

  // CREATE TOPIC
  let txResponse = await new TopicCreateTransaction().execute(client);
  let receipt = await txResponse.getReceipt(client);

  let topicId = receipt.topicId;

  console.log(`The newly created topic ID is: ${topicId}`);

  // Timeout to get the network time to process this request before continuing with another action
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // SEND MESSAGE
  const sendResponse = await new TopicMessageSubmitTransaction({
    topicId,
    message: new Date().toTimeString()
  })
    .execute(client);

  const getReceipt = await sendResponse.getReceipt(client);

  console.log('Message receipt:');
  console.log(JSON.stringify(getReceipt));

  console.log(`The message transaction status is: ${getReceipt.status}`);

  console.log(`Link to topic: https://hashscan.io/testnet/topic/${topicId}`);

  // SUBSCRIBE/READ TOPIC
  new TopicMessageQuery()
    .setTopicId(topicId)
    .setStartTime(0)
    .subscribe(
      client,
      (message) => console.log(Buffer.from(message.contents, "utf8").toString())
    );

  process.exit();
}

main();
