const sleep = require('sleep');

function delay () {
  sleep.sleep(1);
  return new Promise((resolve, reject)=> {
    resolve(1);
  }); 
}



async function delayedLog(item) {
  await delay();

  console.log(item);
}


async function processArray(array) {
  // array.forEach(async (element) => {
  //   await delayedLog(element);
  // });

  for(const item of array) {
    await delayedLog(item);
  }

  console.log('Done!');
}



processArray([1,2,3,4,5])