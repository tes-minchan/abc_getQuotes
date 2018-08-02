/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               GOPAX REST API
 *   GENERAL DESCRIPTION
 *     Get quotes from REST API.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 코인 가격을 Redis Table에 저장함.
 *
 *   REFERENCE WEBSITE
 *     https://gopaxapi.github.io/gopax/
 *     Limit : 20 req per 1sec.
 * 
 *   SUPPORTED CURRENCY
 *     Refer to https://api.gopax.co.kr/trading-pairs
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const axios  = require('axios');
const Redis  = require('redis');
const config = require('../config');

const market = 'GOPAX';
const currencyList   = [ 'BTC-KRW', 'ETH-KRW', 'XRP-KRW', 'EOS-KRW', 'LOOM-KRW', 'ZRX-KRW'];
const redisTableList = [ 'BTCKRW', 'ETHKRW', 'XRPKRW', 'EOSKRW', 'LOOMKRW', 'ZRXKRW'];

function gopax_API () {
  console.log(`${market} REST API Start.`);

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  this.getOrderbook = (CURRENCY) => {
    setInterval(() => {

      axios.get(`https://api.gopax.co.kr/trading-pairs/${CURRENCY}/book`)
      .then(response => {
        let toSaveRedis = redisTableList[currencyList.indexOf(CURRENCY)];
        let REDIS_ASK_HNAME = `${market}_${toSaveRedis}_ASK`;
        let REDIS_BID_HNAME = `${market}_${toSaveRedis}_BID`;

        response.data.ask.map((item, index) => {
          if(index > 20) {
            return;
          }
          redisClient.hset(REDIS_ASK_HNAME,item[1],item[2]);
        });

        response.data.bid.map((item, index) => {
          if(index > 20) {
            return;
          }
          redisClient.hset(REDIS_BID_HNAME,item[1],item[2]);
        });

      });

    },500);
  }

}

module.exports = gopax_API
