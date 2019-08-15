const Gun = require("gun");
const Bottleneck = require("bottleneck");
const pLimit = require("p-limit");

// const URL = "http://goodgundb.3mae6nqjdw.us-west-2.elasticbeanstalk.com/";
// const URL = "http://localhost:4444/";
//const URL = "http://localhost:8765/gun";
const URL = "https://goodgun-prod.herokuapp.com/gun";
//const URL = "http://163.172.135.213:8765/gun"
function printConfig(maxConcurrent, totalPuts, numClients) {
  console.log(
    "====================================================================="
  );
  console.log(
    `making ${totalPuts} puts ${maxConcurrent} puts concurrently. clients: ${numClients}`
  );
  console.log(
    "====================================================================="
  );
}

function printResults(successfulPutsCount, failedPutsCount, totalTime) {
  console.log(
    "====================================================================="
  );
  console.log(`${failedPutsCount} puts failed`);
  console.log(
    `${successfulPutsCount} successful puts were made in ${totalTime} seconds. ${successfulPutsCount /
      totalTime} TPS.`
  );
  console.log(
    "====================================================================="
  );
}

function makePut(client, i) {
  return new Promise(resolve => {
    // console.log(i);
    const randkey = Math.random();
    client.get(randkey).put(
      {
        i,
        text: randkey.toString(),
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAKUlEQVR42u3NQQEAAAQEsJNcdGLw2AqskukcKLFYLBaLxWKxWCwW/40XXe8s4935ED8AAAAASUVORK5CYII="
      },
      ack => {
        // console.log({ ack, i });
        if (ack.err) {
          return resolve(false);
        }
        // if (i % 100 === 0) console.log("done", i);
        resolve(true);
      }
    );
  });
}

function getSuccessfulAndFailedPutsCounts(promisesResults) {
  const successfulPutsCount = promisesResults.filter(
    promiseResult => promiseResult
  ).length;
  const failedPutsCount = promisesResults.length - successfulPutsCount;

  return [successfulPutsCount, failedPutsCount];
}

async function runTest(maxConcurrent, totalPuts, numClients, type = "fast") {
  printConfig(maxConcurrent, totalPuts, numClients);

  console.log("Connecting to Gun server:", URL);
  const testNumber = Math.random();
  const clients = [];
  for (let i = 0; i < numClients; i++) {
    const client = Gun({
      peers: [URL],
      radisk: false,
      localStorage: false,
      axe: false,
      multicast: false
    });
    const testNode = client.get(`test-${testNumber}`);
    testNode.put({ client: i });
    await testNode;
    // testNode.put({ client: i });
    console.log("Initialized client", i);
    if (type == "slow") clients.push(testNode);
    else clients.push(client);
  }
  while (true) {
    const limiter = pLimit(maxConcurrent);
    // const limiter = new Bottleneck({
    //   maxConcurrent,
    //   minTime: 100
    // });

    const promises = [];

    for (let i = 0; i < totalPuts; i++) {
      // const putPromise = limiter.schedule(makePut(clients[i % numClients], i));
      const putPromise = limiter(() => makePut(clients[i % numClients], i));
      promises.push(putPromise);
    }

    const start = Date.now();
    const promisesResults = await Promise.all(promises);
    const totalTime = (Date.now() - start) / 1000;

    const [
      successfulPutsCount,
      failedPutsCount
    ] = getSuccessfulAndFailedPutsCounts(promisesResults);

    printResults(successfulPutsCount, failedPutsCount, totalTime);
  }

  process.exit(0);
}

const maxConcurrent = 100;
const totalPuts = 1000;
const numClients = 5;
runTest(maxConcurrent, totalPuts, numClients);
//runTest(maxConcurrent, totalPuts, numClients, "slow");
