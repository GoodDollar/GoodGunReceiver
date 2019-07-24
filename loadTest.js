const Gun = require("gun");
const Bottleneck = require("bottleneck");

const URL = "http://goodgundb.3mae6nqjdw.us-west-2.elasticbeanstalk.com/";

function printConfig(maxConcurrent, totalPuts) {
  console.log(
    "====================================================================="
  );
  console.log(`making ${totalPuts} puts ${maxConcurrent} puts concurrently`);
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
    `${successfulPutsCount} successful puts were made in ${totalTime} seconds`
  );
  console.log(
    "====================================================================="
  );
}

function makePut(client) {
  return new Promise(resolve => {
    const testNumber = Math.random();
    client.get(`test-${testNumber}`).put(
      {
        testNumber,
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAKUlEQVR42u3NQQEAAAQEsJNcdGLw2AqskukcKLFYLBaLxWKxWCwW/40XXe8s4935ED8AAAAASUVORK5CYII="
      },
      ack => {
        if (ack.err) {
          resolve(false);
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

async function runTest(maxConcurrent, totalPuts) {
  printConfig(maxConcurrent, totalPuts);

  const client = Gun(URL);
  const limiter = new Bottleneck({
    maxConcurrent
  });

  const promises = [];

  for (let i = 0; i < totalPuts; i++) {
    const putPromise = limiter.schedule(() => makePut(client));
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

const maxConcurrent = 100;
const totalPuts = 1000;

runTest(maxConcurrent, totalPuts);
