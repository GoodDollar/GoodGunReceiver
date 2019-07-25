const Gun = require("gun");
const Bottleneck = require("bottleneck");

// const URL = "http://goodgundb.3mae6nqjdw.us-west-2.elasticbeanstalk.com/";
const URL = "http://localhost:4444/";

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
    const testNumber = Math.random();
    client
      .get("tests")
      .get(`test-${testNumber}`)
      .get(i)
      .put(
        {
          testNumber,
          image:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAKUlEQVR42u3NQQEAAAQEsJNcdGLw2AqskukcKLFYLBaLxWKxWCwW/40XXe8s4935ED8AAAAASUVORK5CYII="
        },
        ack => {
          // console.log({ ack, i });
          if (ack.err) {
            return resolve(false);
          }
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

async function runTest(maxConcurrent, totalPuts, numClients) {
  printConfig(maxConcurrent, totalPuts, numClients);

  console.log("Connecting to Gun server:", URL);
  const clients = [];
  for (let i = 0; i < numClients; i++) {
    const client = Gun({
      peers: [URL],
      radisk: false,
      localStorage: false,
      axe: false
    });
    clients.push(client);
  }
  const limiter = new Bottleneck({
    maxConcurrent
  });

  const promises = [];

  for (let i = 0; i < totalPuts; i++) {
    const putPromise = limiter.schedule(() =>
      makePut(clients[i % numClients], i)
    );
    promises.push(putPromise);
  }

  const start = Date.now();
  const promisesResults = await Promise.all(promises);
  const totalTime = Math.ceil((Date.now() - start) / 1000);

  const [
    successfulPutsCount,
    failedPutsCount
  ] = getSuccessfulAndFailedPutsCounts(promisesResults);

  printResults(successfulPutsCount, failedPutsCount, totalTime);

  process.exit(0);
}

const maxConcurrent = 20;
const totalPuts = 300;
const numClients = 10;
runTest(maxConcurrent, totalPuts, numClients);
