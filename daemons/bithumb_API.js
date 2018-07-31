/*
* https://api.bithumb.com/public/orderbook/ALL
* {currency} = BTC, ETH, DASH, LTC, ETC, XRP, BCH, XMR, ZEC, QTUM, BTG, EOS, ICX, VEN, TRX, ELF, MITH, MCO, OMG, 
               KNC, GNT, HSR, ZIL, ETHOS, PAY, WAX, POWR, LRC, GTO, STEEM, STRAT, ZRX, REP, AE, XEM, SNT, ADA (기본값: BTC), ALL(전체)
*/

let axios  = require('axios');
let Redis  = require('redis');
let _      = require('underscore');
var config = require('../config');

const market = 'BITHUMB';


function bithumb_API () {
  console.log(market + ' REST API Start.');

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

