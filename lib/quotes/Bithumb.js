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
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

// npm modules.
const REDIS = require('redis');
const AXIOS = require('axios');

// custom module or config.
const CONFIG      = require('../../config');
const redisClient = REDIS.createClient(CONFIG.redisConfig);


function BithumbRESTAPI () {

  this.Market       = "BITHUMB";
  this.RestAPIURL   = "https://api.bithumb.com/public/orderbook/ALL";
  this.TimeInternal = 1000; // ms
}

BithumbRESTAPI.prototype.connect = function() {
  console.log(`${this.Market} REST API Start.`);

  const self = this;
  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;

  setInterval(() => {

    AXIOS.get(this.RestAPIURL)
    .then(response => {
      if(response.status === 200) {
        redisClient.set(RedisHeartBeatTable,true);
        let parseCoin = Object.keys(response.data.data);
        _saveOrderbook(self.Market, parseCoin, response.data.data);

      }
    })
    .catch(error => {
      if(error) {
        console.log(`${self.Market} Request Error`);
        console.log(error);
        redisClient.set(RedisHeartBeatTable, false);
      }
    });


  }, this.TimeInternal);
}

/**  
  * @typedef _saveOrderbook  
  * @param  
  * @description 웹소켓에서 받은 data를 coin 별로 Redis Table에 저장.
  * @returns 
*/ 

function _saveOrderbook (market, coinArr, orderbookObj) {
  coinArr.forEach(coin => {

    if(coin === 'timestamp' || coin === 'payment_currency') 
      return;

    const RedisAskHashTable = `${market}_${coin}KRW_ASK`;
    const RedisBidHashTable = `${market}_${coin}KRW_BID`;

    redisClient.del(RedisAskHashTable);
    redisClient.del(RedisBidHashTable);

    orderbookObj[coin].asks.forEach(orderbook => {
      redisClient.hset(RedisAskHashTable,orderbook.price,orderbook.quantity);
    });

    orderbookObj[coin].bids.forEach(orderbook => {
      redisClient.hset(RedisBidHashTable,orderbook.price,orderbook.quantity);
    });

  });

}


module.exports = BithumbRESTAPI;