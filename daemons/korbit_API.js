/* https://api.korbit.co.kr/v1/orderbook?currency_pair=btc_krw
*
*/

let axios  = require('axios');
let Redis  = require('redis');
let _      = require('underscore');
var config = require('../config');

const market = 'KORBIT';


function korbit_API () {
  console.log(market + ' REST API Start.');

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  this.getOrderbook = function() {
    setInterval(function(){

      axios.get('https://api.korbit.co.kr/v1/orderbook?currency_pair=btc_krw')
      .then(function(response) {
        // let orderbook_BTCKRW = response.data.data.BTC;
        // console.log(response.data.bids);
        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        _.map(response.data.asks, function(item) {
          redisClient.hset(REDIS_ASK_HNAME,item[0],item[1]);
        });

        _.map(response.data.bids, function(item) {
          redisClient.hset(REDIS_BID_HNAME,item[0],item[1]);
        });

      });

    },500);
  }

}



module.exports = korbit_API
