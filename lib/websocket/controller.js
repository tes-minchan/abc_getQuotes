const Redis = require('redis');
const Config = require('../../config');
const redisClient = Redis.createClient(Config.redisConfig);

const ASK = 0;
const BID = 1;

module.exports = {

  getOrderbook : function(currency, callback) {

    const redis_table = [];
    redis_table.push(['zrange',`ORDERBOOK_${currency.toUpperCase()}_ASK`, 0, -1, 'WITHSCORES']);
    redis_table.push(['zrange',`ORDERBOOK_${currency.toUpperCase()}_BID`, 0, -1, 'WITHSCORES']);


    redisClient.multi(redis_table).exec((error, values) => {

      let return_val = values.map(item => {
        return item;
      });

      callback(return_val);

    });

  },


  parseOrderbook : async function(orderbook, callback) {

    // Internal Function.
    // type, ASK : 0, BID : 1
    const _processAsyncArr = function(array, type) {
        
      return new Promise((resolve)=> {

        let orderbook_arr = [];
        let orderbook = {
          market : null,
          price  : 0,
          volume : 0
        }

        let count_index = 0;
        for (const [index, value] of array.entries()) {
          
          count_index++;

          if(index%2 === type) {
            // market_volume
            orderbook.market = value.split('_')[0];
            orderbook.volume = value.split('_')[1];
          }
          else {
            // price
            orderbook.price = value;
          }

          if(count_index == 2) {
            orderbook_arr.push(orderbook);
            count_index = 0;
            orderbook = {
              market : null,
              price  : 0,
              volume : 0
            }
          }
        }

        resolve(orderbook_arr);

      });

    }

    const _getOrderbook = async function (getOrderbook) {
      return new Promise((resolve, reject)=> {
        let parseOrderbook = {
          ASK : null,
          BID : null
        }

        orderbook.map(async (item, item_index) => {

          if(item_index < 1) {
            // ASK
            parseOrderbook.ASK  = await _processAsyncArr(item, ASK);
    
          }
          else {
            // BID
            item.reverse();
            parseOrderbook.BID  = await _processAsyncArr(item, BID);
          }
    
        });

        if(parseOrderbook) {

          resolve(parseOrderbook);
        }
        else {
          reject(null);
        }

      });
    }
    
    callback(await _getOrderbook(orderbook));

  }



}