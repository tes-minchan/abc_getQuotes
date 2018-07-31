/*
* https://api.bitfinex.com/v1/book/btcusd
*/

let axios  = require('axios');
let Redis  = require('redis');
let _      = require('underscore');
var config = require('../config');

const market = 'BITFINEX';


function bithumb_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  this.getOrderbook = function() {
    setInterval(function(){

      axios.get('https://api.bithumb.com/public/orderbook/ALL')
      .then(function(response) {

        let orderbook_BTCKRW = response.data.data.BTC;

        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        _.map(orderbook_BTCKRW.asks, function(item) {
          redisClient.hset(REDIS_ASK_HNAME,item.price,item.quantity);
        });
        _.map(orderbook_BTCKRW.bids, function(item) {
          redisClient.hset(REDIS_BID_HNAME,item.price,item.quantity);
        });

      });

    },500);
  }

}


module.exports = bithumb_API

