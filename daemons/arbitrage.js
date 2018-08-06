/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               Arbitrage
 *   GENERAL DESCRIPTION
 *     Redis에 저장되어 있는 마켓별 코인 가격을 비교하여 Arbitrage가능한 마켓과 가격을 Redis에 저장.
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

const Redis  = require('redis');
const config = require('../config');
const redisClient = Redis.createClient(config.redisConfig);



class Arbitrage {

  /**
   * Creates a Quotes instance.
   *
   */
  constructor () {
    this.redisTable = {
      BTC : [],
      ETH : [],
      EOS : [],
      XRP : [],
      ZRX : [],
      LOOM : []
    }

    this.redisTable.BTC = _getMarketName('BTC');
    this.redisTable.ETH = _getMarketName('ETH');
    this.redisTable.EOS = _getMarketName('EOS');
    this.redisTable.XRP = _getMarketName('XRP');
    this.redisTable.ZRX = _getMarketName('ZRX');
    this.redisTable.LOOM = _getMarketName('LOOM');

  }

  getOrderbook(toGetRedisTable, currency) {
    if(!toGetRedisTable) {
      console.log("Need to redisTable !!!");
      return;
    }

    let toBuyMarket = {
      market : "",
      maxAsk : 0,
      volume : 0
    };

    let toSellMarket = {
      market : "",
      minBid : 0,
      volume : 0
    };


    redisClient.multi(toGetRedisTable).exec((error, result) => {
      result.map((item, index) => {
        if(!item) {
          return;
        }

        let market = toGetRedisTable[index][1].split('_')[0];
        let type   = toGetRedisTable[index][1].split('_')[2];
        let price  = Object.keys(item);
        let volume = Object.values(item);
        
        if(market === 'BITFINEX') {
          price = price.sort((a,b) => a - b);
        }

        if(type === "ASK") {

          if(index === 0){
            toSellMarket.market = market;
            toSellMarket.maxAsk = price[0];
            toSellMarket.volume = result[index][price[0]];
          }
          else {

            // Max Ask to sell
            if( price[0] > toSellMarket.maxAsk ) {
              toSellMarket.market = market;
              toSellMarket.maxAsk = price[0];
              toSellMarket.volume = result[index][price[0]];

            }
          }

        }
        else {
          let [price_length, volume_length] = [price.length-1,volume.length-1];

          if(index === 1) {
            toBuyMarket.market = market;
            toBuyMarket.minBid = price[price_length];
            toBuyMarket.volume = volume[volume_length];
          }
          else {
            // Min Bid to buy.
            if( price[price_length] < toBuyMarket.minBid ) {
              toBuyMarket.market = market;
              toBuyMarket.minBid = price[price_length];
              toBuyMarket.volume = volume[volume_length];
            }
          }
        }

      });

      let toSaveRedis = {
        buy  : toBuyMarket,
        sell : toSellMarket
      };

      redisClient.hset("arbitrage",currency, JSON.stringify(toSaveRedis));

    });

  }

}

// Get Redis Table Name.
_getMarketName = (counter_currency) => {
  let redisTable = [];

  let quote_currency = 'KRW';
  config.redisTableArbitrage.krw_market.map(getMarket => {
    redisTable.push(["hgetall", `${getMarket}_${counter_currency}${quote_currency}_ASK`]);
    redisTable.push(["hgetall", `${getMarket}_${counter_currency}${quote_currency}_BID`]);
  });

  // quote_currency = 'USD';
  // config.redisTableArbi.usd_market.map(getMarket => {
  //   redisTable.push(["hgetall", `${getMarket}_${counter_currency}${quote_currency}_ASK`]);
  //   redisTable.push(["hgetall", `${getMarket}_${counter_currency}${quote_currency}_BID`]);
  // });

  return redisTable;
}

module.exports = Arbitrage;
