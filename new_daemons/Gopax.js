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
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

// npm modules.
const REDIS = require('redis');
const AXIOS = require('axios');

// custom module or config.
const CONFIG      = require('../config');
const redisClient = REDIS.createClient(CONFIG.redisConfig);

function GopaxRESTAPI () {

  this.Market       = "GOPAX";
  this.RestAPIURL   = "https://api.gopax.co.kr/trading-pairs";
  this.TimeInternal = 1000; // ms
}

GopaxRESTAPI.prototype.connect = function(CURRENCY) {
  console.log(`${this.Market} REST API Start.`);

  const redisClient = REDIS.createClient(CONFIG.redisConfig);
  const self = this;

  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  let checkGetResponse = true;

  setInterval(() => {

    if(checkGetResponse) {
      checkGetResponse = !checkGetResponse;

      AXIOS.get(`${this.RestAPIURL}/${CURRENCY}-KRW/book`)
        .then(response => {
          checkGetResponse = !checkGetResponse;

          if(response.status === 200) {
            redisClient.set(RedisHeartBeatTable,true);
  
            const RedisAskHashTable = `${self.Market}_${CURRENCY}KRW_ASK`;
            const RedisBidHashTable = `${self.Market}_${CURRENCY}KRW_BID`;
            
            redisClient.del(RedisAskHashTable);
            redisClient.del(RedisBidHashTable);
    
            response.data.ask.forEach((orderbook, index) => {
              if(index > 20) {
                return;
              }
              redisClient.hset(RedisAskHashTable,orderbook[1],orderbook[2]);
            });
    
            response.data.bid.forEach((orderbook, index) => {
              if(index > 20) {
                return;
              }
              redisClient.hset(RedisBidHashTable,orderbook[1],orderbook[2]);
            });
          }
  
        })
        .catch(error => {
          console.log(`${self.Market} Request Error ${CURRENCY}`);
          checkGetResponse = !checkGetResponse;
          redisClient.set(RedisHeartBeatTable, false);
        })
    }

  },this.TimeInternal);

}

module.exports = GopaxRESTAPI;
