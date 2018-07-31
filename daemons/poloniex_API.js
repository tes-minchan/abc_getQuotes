// https://poloniex.com/public?command=returnOrderBook&currencyPair=USDT_BTC&depth=10

let axios  = require('axios');
let Redis  = require('redis');
let _      = require('underscore');
var config = require('../config');

const market = 'POLONIEX';


function poloniex_API () {
  console.log(market + ' REST API Start.');

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  this.getOrderbook = function() {
    setInterval(function(){

      axios.get('https://poloniex.com/public?command=returnOrderBook&currencyPair=USDT_BTC&depth=20')
      .then(function(response) {
        var orderbook_BTCKRW = response.data;

        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        _.map(orderbook_BTCKRW.asks, function(item) {
          redisClient.hset(REDIS_ASK_HNAME,item[0],item[1]);
        });

        _.map(orderbook_BTCKRW.bids, function(item) {
          redisClient.hset(REDIS_BID_HNAME,item[0],item[1]);
        });

      });

    },500);
  }

}


module.exports = poloniex_API
