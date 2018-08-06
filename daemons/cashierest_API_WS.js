
const Redis = require('redis');
const sleep = require('sleep');
const WSCLINET = require('ws-reconnect');
const URL = `wss://www.cashierest.com/signalr/connect?transport=webSockets&clientProtocol=1.5&connectionToken=9XaN1HvSrvIqa9%2FDMEG%2BN%2F1pMuJkh%2FeMu8jfHdnrrfWeqRMYKfcTsVUQaL7s6Z0XBG0BXOx7ENaYEE8m1vIJeQ36XjQHgIZnx0qp%2FNbPHpiFtl7%2FiNFIu0LdsMcHqcFd&connectionData=%5B%7B%22name%22%3A%22stockcoinbuyticker%22%7D%2C%7B%22name%22%3A%22stockcoinsellticker%22%7D%2C%7B%22name%22%3A%22stockcointicker%22%7D%2C%7B%22name%22%3A%22stockcointurnoverticker%22%7D%5D&tid=5`;
const wsclient = new WSCLINET(URL);
const config   = require('../config');
const MARKET     = 'CASHIEREST';
const COINLIST   = [ 'BTC', 'ETH', 'EOS', 'ZRX' ];
const REDISTABLE = [ 'BTCKRW', 'ETHKRW', 'EOSKRW', 'ZRXKRW'];


function cashierest_API () {

  const redisClient = Redis.createClient(config.redisConfig);

  this.connect = function() {



    // websocket client start.
    wsclient.start();

    wsclient.on("connect",(connection) => {
      console.log(`${MARKET} Websocket Client Connected `);

      // var msg = {H: "stockcointicker", M: "GetAllStocks", A: [], I: 0};
      var msg = {H: "stockcoinbuyticker", M: "GetAllStocks", A: [], I: 1}
    
      wsclient.socket.send(JSON.stringify(msg));
      sleep.msleep(100);
    
      var msg =  {H: "stockcoinsellticker", M: "GetAllStocks", A: [], I: 2}
      wsclient.socket.send(JSON.stringify(msg));
    
      wsclient.on("message",(data) => {
        var parseJson = JSON.parse(data.toString());
    
        if(parseJson.R) {
          /** 
           * Init orderbook.
           * @param type Orderbook Type (1 : BID, 2 : ASK)
           * @param coinList {object} All coin list, included all coin info.
          */
    
          let type = Number(parseJson.I);
          let coinList = parseJson.R;
    
          if(type === 1) {
            // BID Orderbook
            coinList.map(coin => {
              let toSaveRedis = REDISTABLE[COINLIST.indexOf(coin.CoinCode)];
    
              if(toSaveRedis) {
                this._InitRedisTable(toSaveRedis, coin.CoinBuySum, type);          
              }          
            })
          }
          else {
            // ASK Orderbook
            coinList.map(coin => {
              let toSaveRedis = REDISTABLE[COINLIST.indexOf(coin.CoinCode)];
    
              if(toSaveRedis) {
                this._InitRedisTable(toSaveRedis, coin.CoinSellSum, type);          
              }   
            })
          }
        }
        else if(parseJson.M){
          // console.log(parseJson.M);
          let updateOrderbook = parseJson.M[0];
          if(updateOrderbook) {
            let toSaveRedis = REDISTABLE[COINLIST.indexOf(updateOrderbook.A[0].CoinCode)];
            if (updateOrderbook.H === "stockCoinSellTicker"){  
              let REDIS_ASK_HNAME = `${MARKET}_${toSaveRedis}_ASK`;
              redisClient.del(REDIS_ASK_HNAME);
    
              this._UpdateRedisTable(updateOrderbook.A[0].CoinSellSum, REDIS_ASK_HNAME)
      
            }
            else if (updateOrderbook.H === "stockCoinBuyTicker") {
              let REDIS_BID_HNAME = `${MARKET}_${toSaveRedis}_BID`;
              redisClient.del(REDIS_BID_HNAME);
              this._UpdateRedisTable(updateOrderbook.A[0].CoinBuySum, REDIS_BID_HNAME)
    
            }
          }
    
    
        }
    
      });
    
      this._InitRedisTable = (toSaveRedis, orderbook, type) => {
        let REDIS_ASK_HNAME = `${MARKET}_${toSaveRedis}_ASK`;
        let REDIS_BID_HNAME = `${MARKET}_${toSaveRedis}_BID`;

        if(type === 2) {
          // ASK ORDERBOOK Init.
          redisClient.del(REDIS_ASK_HNAME);
          orderbook.map(item => {
            redisClient.hset(REDIS_ASK_HNAME,item.CoinPrice,item.CoinMoneySurplus.toFixed(5));
          });
        }
        else {
          // BID ORDERBOOK Init.
          redisClient.del(REDIS_BID_HNAME);
          orderbook.map(item => {
            redisClient.hset(REDIS_BID_HNAME,item.CoinPrice,item.CoinMoneySurplus.toFixed(5));
          });
        }
      }
    
      this._UpdateRedisTable = (orderbook, redis_table) => {
        orderbook.map(item => {
          redisClient.hset(redis_table,item.CoinPrice,item.CoinMoneySurplus.toFixed(5));
        });
      }
    
    
    });
  }
}

module.exports = cashierest_API;







