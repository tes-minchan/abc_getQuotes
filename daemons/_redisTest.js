const Redis = require('redis');
const config = require('../config');
const redisClient = Redis.createClient(config.redisConfig);
const _ = require('underscore');

redisClient.hgetall('arbitrage',(error, result, key) => {
  _.map(result, (item, key) => {

    if(key !== 'ZRX') {
      let jsonItem = JSON.parse(item);

      console.log(key);
      console.log(jsonItem);
    }


  });

  
});



// getRedis = () => {
//   setInterval(()=> {

//     redisClient.hgetall('arbitrage',(error, result) => {
//       let price  = Object.keys(result);
//       price = price.sort((a,b) => a - b);
//       console.log("*****************************");
//       console.log(price[0], result[price[0]]);
//       console.log(price[1], result[price[1]]);
//       console.log("=============================");
//     });
//   },500);
  
// }

// getRedis();

