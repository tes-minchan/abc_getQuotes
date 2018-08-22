const Redis = require('redis');
const config = require('./config');
const redisClient = Redis.createClient(config.redisConfig);
const _ = require('underscore');
var arbitrageController = require('./controller/arbitrage');


arbitrage_monit =  () => {
  setInterval(() => {
    redisClient.hgetall('arbitrage',(error, result) => {

      if(error) {
        return;
      }
    
      _.map(result, (item, key) => {
    
        if(key !== 'ZRX') {
          let jsonItem = JSON.parse(item);
    
          // ASK
          let askMarket = jsonItem.buy.market;
          let askPrice = Number(jsonItem.buy.minAsk);
          let askVolume = Number(jsonItem.buy.volume);
    
          // BID
          let bidPrice = Number(jsonItem.sell.maxBid);
          let bidVolume = Number(jsonItem.sell.volume);
          let bidMarket = jsonItem.sell.market;
    
          // Gap
          let marketGap = bidPrice - askPrice;
          let minCoinVol = (askVolume > bidVolume) ? bidVolume : askVolume;
    
          // Fiat Benefit
          let requiredFiatFunds = (askPrice*minCoinVol);
          let fiatProfit = minCoinVol * (bidPrice - askPrice);
          fiatProfit = fiatProfit;
    
          // Crypto Coin Benefit
          let requiredCoinFunds = (minCoinVol * bidPrice);
          let coinProfit = (requiredCoinFunds/askPrice - minCoinVol);
    
          // Common value.
          let percentageProfit = (coinProfit/minCoinVol) * 100;
          percentageProfit = Math.round(percentageProfit*100)/100;
          
    
          if(percentageProfit > 1) {
            let toSaveArbitrage = {};
            toSaveArbitrage.coin = key;
    
            toSaveArbitrage.askMarket = askMarket;
            toSaveArbitrage.askPrice  = askPrice;
            toSaveArbitrage.askVol    = askVolume;
    
            toSaveArbitrage.bidMarket = bidMarket;
            toSaveArbitrage.bidPrice  = bidPrice;
            toSaveArbitrage.bidVol    = bidVolume;
    
            toSaveArbitrage.reqFiatFunds = requiredFiatFunds;
            toSaveArbitrage.fiatProfit   = fiatProfit;
    
            toSaveArbitrage.reqCoinFunds = requiredCoinFunds;
            toSaveArbitrage.coinProfit   = coinProfit;
    
            toSaveArbitrage.percentage = percentageProfit;
    
            arbitrageController.updateArbitrage(toSaveArbitrage, (error, result) => {
              if(error) {
                console.log(error);
                console.log("error to update db");
              }
    
            });
    
          }
        }
    
    
      });
    
      
    });






  },1000);
}

arbitrage_monit();






