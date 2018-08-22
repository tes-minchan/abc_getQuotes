/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               POLONIEX REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://poloniex.com/support/api/
 *     Limit : 6 calls per second.
 * 
 *   SUPPORTED CURRENCY
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

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

        orderbook_BTCKRW.asks.map(item => {
          redisClient.hset(REDIS_ASK_HNAME,item[0],item[1]);
        });

        orderbook_BTCKRW.bids = orderbook_BTCKRW.bids.reverse();
        orderbook_BTCKRW.bids.map(item => {
          redisClient.hset(REDIS_BID_HNAME,item[0],item[1]);
        })

      });

    },500);
  }

}


module.exports = poloniex_API
