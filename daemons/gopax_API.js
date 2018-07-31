/*
* https://api.gopax.co.kr/trading-pairs/BTC-KRW/book
*/

let axios  = require('axios');
let Redis  = require('redis');
let _      = require('underscore');
var config = require('../config');

const market = 'GOPAX';


function gopax_API () {
  console.log(market + ' REST API Start.');

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  this.getOrderbook = function() {
    setInterval(function(){

      axios.get('https://api.gopax.co.kr/trading-pairs/BTC-KRW/book')
      .then(function(response) {

        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        if(response.data.ask.length > 0) {
          for(var index = 0; index < 10; index++) {
            let ask_orderbook = response.data.ask[index];
            let bid_orderbook = response.data.bid[index];
  
            redisClient.hset(REDIS_ASK_HNAME,ask_orderbook[1],ask_orderbook[2]);
            redisClient.hset(REDIS_BID_HNAME,bid_orderbook[1],bid_orderbook[2]);
  
          }
        }


      });

    },500);
  }

}



module.exports = gopax_API
