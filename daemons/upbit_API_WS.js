/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               UPBIT WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket.
 *     currencyList 변수에 코인 통화쌍을 추가하면 해당 통화를 subscribe하고 가격을 받아옴. 
 * 
 *   REFERENCE WEBSITE
 *     https://docs.upbit.com/docs
 * 
 *   SUPPORTED CURRENCY
 *     BTC, ETH, EOS, XRP, LOOM, ZRX
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/


const Redis    = require('redis');
const WSCLINET = require('ws-reconnect');
const wsclient = new WSCLINET("wss://api.upbit.com/websocket/v1");
const config   = require('../config');

// This currencyList formt is depends on UPBIT.
const currencyList   = [ 'KRW-BTC', 'KRW-ETH', 'KRW-EOS', 'KRW-XRP', 'KRW-LOOM', 'KRW-ZRX' ];
const redisTableList = [ 'BTCKRW', 'ETHKRW', 'EOSKRW', 'XRPKRW', 'LOOMKRW', 'ZRXKRW' ];

const market = 'UPBIT';

function upbit_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
 
  // websocket methods.
  this.connect = function() {

    // websocket client start.
    wsclient.start();

    wsclient.on("connect",function(connection) {
      console.log(`${market} Websocket Client Connected`);

      var ticket = {
        "ticket" : "getQuotes"
      }

      var type = {
        "type" : "orderbook",
        "codes" : currencyList,
        "isOnlySnapshot" : false
      }

      // Set to subscribe currency informations.
      var subscribe = [];
      subscribe.push(ticket);
      subscribe.push(type);
      subscribe = JSON.stringify(subscribe);
      wsclient.socket.send(subscribe);

    });

    wsclient.on("destroyed",function() {
      console.log("destroyed");
    });

    wsclient.on("reconnect",function() {
      console.log("reconnecting");
    });

    wsclient.on("message",function(data) {
      var parseJson = JSON.parse(data.toString());

      // Get to save redis table name.
      let toSaveRedis = redisTableList[currencyList.indexOf(parseJson.code)];

      // set to save redis hash table name.
      let REDIS_ASK_HNAME = market + '_' + toSaveRedis + '_ASK';
      let REDIS_BID_HNAME = market + '_' + toSaveRedis + '_BID';

      redisClient.del(REDIS_ASK_HNAME);
      redisClient.del(REDIS_BID_HNAME);

      parseJson.orderbook_units.map(item => {
        redisClient.hset(REDIS_ASK_HNAME,item.ask_price,item.ask_size.toFixed(3));
        redisClient.hset(REDIS_BID_HNAME,item.bid_price,item.bid_size.toFixed(3));
      });

    });

  }  
  
}

module.exports = upbit_API
