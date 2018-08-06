let Redis = require('redis');
var config = require('../config');
let redisClient = Redis.createClient(config.redisConfig);



getRedis = () => {
  setInterval(()=> {

    redisClient.hgetall('BITFINEX_XRPUSD_ASK',(error, result) => {
      let price  = Object.keys(result);
      price = price.sort((a,b) => a - b);
      console.log("*****************************");
      console.log(price[0], result[price[0]]);
      console.log(price[1], result[price[1]]);
      console.log("=============================");
    });
    redisClient.hgetall('BITFINEX_XRPUSD_BID',(error, result) => {
      let price  = Object.keys(result);
      price = price.sort((a,b) => b - a);
      console.log(price[0], result[price[0]]);
      console.log(price[1], result[price[1]]);
      console.log("*****************************");
    });



  },500);
  
}

getRedis();

