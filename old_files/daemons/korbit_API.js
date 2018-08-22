/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               KORBIT REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://apidocs.korbit.co.kr/
 *     Limit : 12 req per 1sec.
 *
 *   SUPPORTED CURRENCY
 *      btc_krw, etc_krw, eth_krw, xrp_krw, bch_krw, ltc_krw
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

let axios  = require('axios');
let Redis  = require('redis');
var config = require('../config');

const market = 'KORBIT';
const currencyList   = [ 'btc_krw' ,'eth_krw' ,'xrp_krw'];
const redisTableList = [ 'BTCKRW', 'ETHKRW', 'XRPKRW' ];


function korbit_API () {
  console.log(`${market} REST API Start.`);

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  this.getOrderbook = function(CURRENCY) {
    setInterval(() => {

      axios.get(`https://api.korbit.co.kr/v1/orderbook?currency_pair=${CURRENCY}`)
      .then((response) => {

        let toSaveRedis = redisTableList[currencyList.indexOf(CURRENCY)];
        let REDIS_ASK_HNAME = `${market}_${toSaveRedis}_ASK`;
        let REDIS_BID_HNAME = `${market}_${toSaveRedis}_BID`;

        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        response.data.asks.map(item => {
          redisClient.hset(REDIS_ASK_HNAME,item[0],item[1]);
        });

        response.data.bids.map(item => {
          redisClient.hset(REDIS_BID_HNAME,item[0],item[1]);
        });

      });

    },500);
  }

}

module.exports = korbit_API
