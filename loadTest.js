const Gun = require("gun");
const R = require("ramda");

const url = "http://goodgundb.3mae6nqjdw.us-west-2.elasticbeanstalk.com/";

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

function createPromiseArraysArray(clients, totalPuts, putsPerTime) {
  const result = [];

  for (let i = 0; i < totalPuts; i++) {
    const subArrayIndex = Math.floor(i / putsPerTime);

    if (result[subArrayIndex] === undefined) {
      result[subArrayIndex] = [];
    }

    const clientForCurrentPut = clients[i % clients.length];
    result[subArrayIndex].push(makePut(clientForCurrentPut));
  }

  return result;
}

async function resolvePromiseArraysArray(array, time) {
  const arraysResultsArray = [];

  for (let subArray of array) {
    arraysResultsArray.push(
      await resolvePromiseArrayInGivenTime(subArray, time)
    );
  }

  return R.flatten(arraysResultsArray);
}

function resolvePromiseArrayInGivenTime(promiseArray, ms) {
  return Promise.all(
    promiseArray.map(promise =>
      Promise.race([
        promise,
        new Promise(resolve => setTimeout(resolve, ms, false))
      ])
    )
  );
}

function createClientsArray(clientsAmount) {
  const result = [];

  for (let i = 0; i < clientsAmount; i++) {
    result.push(Gun(url));
  }

  return result;
}

async function loadTest(сlientsAmount, totalPuts, putsPerTime, time) {
  const clients = createClientsArray(сlientsAmount);

  const array = createPromiseArraysArray(clients, totalPuts, putsPerTime);

  const results = await resolvePromiseArraysArray(array, time);

  const successfulPuts = results.filter(res => res).length;
  const failedPuts = totalPuts - successfulPuts;

  return [successfulPuts, failedPuts];
}

async function runTest(сlientsAmount, totalPuts, putsPerTime, time) {
  const start = Date.now();
  console.log(
    "====================================================================="
  );
  console.log(
    `${сlientsAmount} clients making total ${totalPuts} puts ${putsPerTime} puts per ${time} milliseconds`
  );
  console.log(
    "====================================================================="
  );

  const [successfulPuts, failedPuts] = await loadTest(
    сlientsAmount,
    totalPuts,
    putsPerTime,
    time
  );

  const totalTime = Math.ceil((Date.now() - start) / 1000);

  console.log(
    "====================================================================="
  );
  console.log(`${failedPuts} puts failed`);
  console.log(
    `${сlientsAmount} clients made ${successfulPuts} successful puts in ${totalTime} seconds`
  );
  console.log(
    "====================================================================="
  );

  process.exit(0);
}

const сlientsAmount = 3;
const totalPuts = 1000;
const putsPerTime = 100;
const time = 1000;

runTest(сlientsAmount, totalPuts, putsPerTime, time);
