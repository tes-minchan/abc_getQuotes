/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               BITFINEX WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 통화를 subscribe하고 가격을 받아옴. 
 * 
 *   REFERENCE WEBSITE
 *     https://docs.bitfinex.com/docs
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
const wsclient = new WSCLINET("wss://api.bitfinex.com/ws/2");
const config = require('../config');

const market = 'BITFINEX';
const currencyList   = [ 'tBTCUSD', 'tETHUSD', 'tEOSUSD', 'tXRPUSD', 'tZRXUSD'];
// const redisTableList = [ 'BTCUSD', 'ETHUSD', 'EOSUSD', 'XRPUSD', 'ZRXUSD' ];

function bitfinex_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
  let currencyInfo = {};

  // websocket methods.
  this.connect = () => {

    // websocket client start.
    wsclient.start();

    wsclient.on("connect",(connection) => {
      console.log(`${market} Websocket Client Connected, [${currencyList}]`);

      currencyList.map(currency => {
        let msg = JSON.stringify({ 
          event: 'subscribe', 
          channel: 'book', 
          symbol: currency
        })
  
        wsclient.socket.send(msg);
        sleep.msleep(200);
      });


    });

    wsclient.on("destroyed",() => {
      console.log("destroyed");
    });

    wsclient.on("reconnect",() => {
      console.log("reconnecting");
    });

    wsclient.on("message",(data) => {
      var parseJson = JSON.parse(data.toString());

      if(parseJson.event === 'subscribed') {
        // Setting currency infor
        currencyInfo[parseJson.chanId] = (parseJson);
      }
      else if(parseJson.event === 'info' || parseJson[1] === 'hb') {
        return;
      }
      else if(Object.keys(parseJson[1]).length > 10){
        // Init orderbooks.       
        this._initRedisTable(redisClient, currencyInfo[parseJson[0]].pair, parseJson[1]);
      }
      else {
        // Update orderbooks.        
        this._updateRedisTable(redisClient, currencyInfo[parseJson[0]].pair, parseJson[1]);
      }
    });
  }  

  this._initRedisTable = (redisClient, currency, orderbook) => {

    let REDIS_ASK_HNAME = `${market}_${currency}_ASK`;
    let REDIS_BID_HNAME = `${market}_${currency}_BID`;
    
    redisClient.del(REDIS_ASK_HNAME);
    redisClient.del(REDIS_BID_HNAME);
  
    orderbook.map(item => {
      if(item[2] > 0) {
        redisClient.hset(REDIS_BID_HNAME,item[0],item[2]);
      }
      else {
        redisClient.hset(REDIS_ASK_HNAME,item[0],Math.abs(item[2]));
      }
    });
  
  }
  
  this._updateRedisTable = (redisClient, currency, orderbook) => {
  
    let REDIS_ASK_HNAME = `${market}_${currency}_ASK`;
    let REDIS_BID_HNAME = `${market}_${currency}_BID`;
    
    // Update orderbook.
    let [price,count,amount] = [orderbook[0], orderbook[1], orderbook[2]];
  
    // when count > 0 then you have to add or update the price level
    if(count > 0) {
      /*
      *  if amount > 0 then add/update bids
      *  if amount < 0 then add/update asks
      */
      if(amount > 0) {
      redisClient.hget(REDIS_BID_HNAME,price,(err, result) => {
        if(result) {
          redisClient.hset(REDIS_BID_HNAME,price,amount);
        }
        else {
          redisClient.hset(REDIS_BID_HNAME,price,amount);
  
        }
      });
      }
      else {
      redisClient.hget(REDIS_ASK_HNAME,price,(err, result) => {
        if(result) {
          redisClient.hset(REDIS_ASK_HNAME,price,Math.abs(amount));
        }
        else {
          redisClient.hset(REDIS_ASK_HNAME,price,Math.abs(amount));
        }
      });
      }
    }
    // when count = 0 then you have to delete the price level.
    else {
      /*
      *  if amount = 1 then remove from bids
      *  if amount = -1 then remove from asks
      */
      if(amount == 1) {
        redisClient.hdel(REDIS_BID_HNAME, price);
      }
      else {
        redisClient.hdel(REDIS_ASK_HNAME, price);
      }
    }
  
  }


  
}





module.exports = bitfinex_API
