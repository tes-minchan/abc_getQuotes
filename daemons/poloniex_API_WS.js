/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               POLONIEX WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 통화를 subscribe하고 가격을 받아옴. 
 * 
 *   REFERENCE WEBSITE
 *     https://poloniex.com/support/api/
 * 
 *   SUPPORTED CURRENCY
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

const _ = require('underscore');
const sleep = require('sleep');
const Redis = require('redis');
const WSCLINET = require('ws-reconnect');
const wsclient = new WSCLINET("wss://api2.poloniex.com");
const config = require('../config');

const market = 'POLONIEX';

const currencyList = {
  121 : {
    symbol : "USDT_BTC",
    toRedisName : "BTCUSD"
  },
  127 : {
    symbol : "USDT_XRP",
    toRedisName : "XRPUSD"
  },
  149 : {
    symbol : "USDT_ETH",
    toRedisName : "ETHUSD"
  },
  // 203 : {
  //   symbol : "USDT_EOS",
  //   toRedisName : "EOSUSD"
  // }
}



function poloniex_API () {

  // connect to redis server.
  const redisClient = Redis.createClient(config.redisConfig);

  this.connect = () => {
    
    // websocket client start.
    wsclient.start();

    wsclient.on("connect",(connection) => {
      console.log(`${market} Websocket Client Connected `);

      _.map(currencyList, (item) => {

        var ticket = {
          "command": "subscribe",
          "channel": item.symbol
        };

        // Set to subscribe currency informations.
        wsclient.socket.send(JSON.stringify(ticket));

        sleep.msleep(200);

      });
    
    });

    wsclient.on("message",(data) => {
      let parseJson = JSON.parse(data);
      let [code, timestamp, orderbook] = [parseJson[0],parseJson[1],parseJson[2]]
      
      if(code === 1010) {
        // Hearbeat
        return;
      }

      orderbook.map(item => {
        if(item[0] === 'i') {
          // Init orderbook.
          this._initRedisTable(redisClient, currencyList[code].toRedisName, item[1].orderBook[0], item[1].orderBook[1])
          
        }
        else if(item[0] === 'o') {
          // Update orderbook.
          this._updateRedisTable(redisClient, currencyList[code].toRedisName, item[1], item[2], item[3])
        }

      });

      
    });


  }


  this._initRedisTable = (redisClient, currency, askOrderbook, bidOrderbook) => {

    let REDIS_ASK_HNAME = `${market}_${currency}_ASK`;
    let REDIS_BID_HNAME = `${market}_${currency}_BID`;
      
    redisClient.del(REDIS_ASK_HNAME);
    redisClient.del(REDIS_BID_HNAME);
    
    _.map(askOrderbook, (amount, price) => {
      redisClient.hset(REDIS_ASK_HNAME,price,amount);
    });

    _.map(bidOrderbook, (amount, price) => {
      redisClient.hset(REDIS_BID_HNAME,price,amount);
    });
  }

  this._updateRedisTable = (redisClient, currency, type, price, amount) => {

    let REDIS_ASK_HNAME = `${market}_${currency}_ASK`;
    let REDIS_BID_HNAME = `${market}_${currency}_BID`;

    if(type === 0){
      // ASK orderbook update
      if(Number(amount) == 0) {
        redisClient.hdel(REDIS_ASK_HNAME, price);
      }
      else {
        redisClient.hset(REDIS_ASK_HNAME, price, amount);
      }
    }
    else {
      // BID orderbook update
      if(Number(amount) == 0) {
        redisClient.hdel(REDIS_BID_HNAME, price);
      }
      else {
        redisClient.hset(REDIS_BID_HNAME, price, amount);
      }
    }
  }
}

module.exports = poloniex_API
