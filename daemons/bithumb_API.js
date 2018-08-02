/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               BITHUMB REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://api.bithumb.com/
 * 
 *   SUPPORTED CURRENCY
 *     BTC, ETH, DASH, LTC, ETC, XRP, BCH, XMR, ZEC, QTUM, BTG, EOS, ICX, VEN, TRX, ELF, MITH, MCO, OMG, 
 *     KNC, GNT, HSR, ZIL, ETHOS, PAY, WAX, POWR, LRC, GTO, STEEM, STRAT, ZRX, REP, AE, XEM, SNT, ADA (기본값: BTC), ALL(전체)
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const axios  = require('axios');
const Redis  = require('redis');
const config = require('../config');
const market = 'BITHUMB';

const currencyList   = [ 'BTC' ,'ETH' ,'EOS' ,'XRP', 'ZRX'];
const redisTableList = [ 'BTCKRW', 'ETHKRW', 'EOSKRW', 'XRPKRW', 'ZRXKRW'];


function bithumb_API () {
  console.log(`${market} REST API Start.`);

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  this.getOrderbook = function() {
    setInterval(() => {

      axios.get('https://api.bithumb.com/public/orderbook/ALL')
      .then(response => {

        currencyList.map(currency => {
          let toSaveRedis = redisTableList[currencyList.indexOf(currency)];
          let REDIS_ASK_HNAME = `${market}_${toSaveRedis}_ASK`;
          let REDIS_BID_HNAME = `${market}_${toSaveRedis}_BID`;

          redisClient.del(REDIS_ASK_HNAME);
          redisClient.del(REDIS_BID_HNAME);

          response.data.data[currency].asks.map(item => {
            redisClient.hset(REDIS_ASK_HNAME,item.price,item.quantity);
          })

          response.data.data[currency].bids.map(item => {
            redisClient.hset(REDIS_BID_HNAME,item.price,item.quantity);
          })

        })

      });

    },500);
  }

}


module.exports = bithumb_API

