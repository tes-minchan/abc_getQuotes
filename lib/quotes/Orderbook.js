/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                    All KRW Market Orderbook Make Script
 *   GENERAL DESCRIPTION
 *
 *   REFERENCE WEBSITE
 * 
 *   SUPPORTED CURRENCY
 *     Based on upbit currency    
 * 
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const MARKET_CONFIG = require('../../config/market');
const CONFIG = require('../../config');
const REDIS = require('redis');
const redisClient = REDIS.createClient(CONFIG.redisConfig);




function OrderbookMake (timer) {

  this.timer = timer;
}


OrderbookMake.prototype.create = function(currency) {

  let redis_table = create_redistable(currency);

  const ask_table = redis_table.map(table => {
    return [`hgetall`, table.ASK] 
  });

  const bid_table = redis_table.map(table => {
    return [`hgetall`, table.BID] 
  });


  setInterval(() => {

    setToRedis(currency, 'ASK', ask_table);
    setToRedis(currency, 'BID', bid_table);

  },this.timer);


}


function create_redistable (currency) {
  
  let redis_table = [];
  CONFIG.marketInfo.krw_market.map(market => {
  
    let index = MARKET_CONFIG[market].coin_list.indexOf(currency);

    if(index > 0) {

      let return_val = {
        ASK : `${market}_${currency.toUpperCase()}KRW_ASK`,
        BID : `${market}_${currency.toUpperCase()}KRW_BID`
      };
      redis_table.push(return_val);
    }
  
  });

  return redis_table;

}

function setToRedis(currency, type, table) {

  redisClient.multi(table).exec((error, values) => {

    if(error) throw error;

    if(!values) {
      console.log("Not Exist Value");
      return;
    }

    // reset orderbook redis table.
    redisClient.del(`ORDERBOOK_${currency.toUpperCase()}_${type.toUpperCase()}`);

    let index = 0;

    for (const [index, element] of values.entries()) {

      if(element === null) {
        console.log(`${table[index][1].split('_')[0]} ${currency} is empty`);
        return;
      }
      else {
        let market  = table[index][1].split('_')[0];
        let prices  = Object.keys(element);
        let volumes = Object.values(element);
  
        prices.forEach((price, price_index) => {
    
          let ask_price = Number(price);
          let desc      = `${market}_${volumes[price_index]}`;
  
          redisClient.ZADD(`ORDERBOOK_${currency.toUpperCase()}_${type.toUpperCase()}`, ask_price, desc, function(err, reply) {
      
            if(err) {
              console.log(err);
            }
          })
        });
      }

    }
  
  });

}


module.exports = OrderbookMake;
