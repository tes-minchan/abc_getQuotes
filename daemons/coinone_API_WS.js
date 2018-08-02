/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               COINONE WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket. 
 *     Coinone API is only for REST, so this websocket is parsed from webbroswer websocket.
 *     currencyList에 등록할 코인을 추가하고, currencyOption에 해당 통화의 가격 gap을 setting 해야함.
 * 
 *   REFERENCE WEBSITE
 *     None.
 *
 *   SUPPORTED CURRENCY
 *     BTC, ETH, EOS, XRP, ZRX
 * 
 *   CREATED DATE, 2018.08.01
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/

var sleep    = require('sleep');
var Redis    = require('redis');
var WSCLINET = require('ws-reconnect');
var config   = require('../config');

const currencyList    = [ 'BTC' ,'ETH' ,'EOS' ,'XRP', 'ZRX'];
const currencyOption  = [ '1000', '100', '10', '1', '1'];
const redisTableList  = [ 'BTCKRW', 'ETHKRW', 'EOSKRW', 'XRPKRW', 'ZRXKRW'];
const market          = 'COINONE';
const volumeCalculate = 10000;

function coinone_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  // utils
  const getCurrencyIndex = function (CURRENCY) {
    return currencyList.indexOf(CURRENCY)
  }

  // websocket methods.
  this.connect = function(CURRENCY) {

    var wsclient = new WSCLINET("wss://push.coinone.co.kr/socket.io/?EIO=3&transport=websocket");

    // set to save redis hash table name.
    let toSaveRedis = redisTableList[currencyList.indexOf(CURRENCY)];
    let REDIS_ASK_HNAME = market + '_' + toSaveRedis + '_ASK';
    let REDIS_BID_HNAME = market + '_' + toSaveRedis + '_BID';
    
    // websocket client start.
    wsclient.start();

    wsclient.on("connect",function(connection){
      console.log(`${market} Websocket Client Connected, ${CURRENCY}`);

      let subscribe = '40/orderbook';
      wsclient.socket.send(subscribe);

      // set websocket send term.
      sleep.msleep(500);

      // subscribe orderbook.
      subscribe = '42/orderbook,["subscribe", "' + CURRENCY + '", ' + currencyOption[getCurrencyIndex(CURRENCY)] + ']';
      wsclient.socket.send(subscribe);

    });

    wsclient.on("destroyed",function(){
      console.log("destroyed");
    });

    wsclient.on("reconnect",function(){
      console.log("reconnecting");
    });

    wsclient.on("message",function(data){

      var msg = data.toString();    
      var init = true;

      if(msg.search('orderbook') !== -1) {

        var split = msg.split('/');

        if(split[0] === '42') {

          var parseMessage = JSON.parse(msg.replace('42/orderbook,',''));
          let ask_price    = JSON.parse(parseMessage[1].ASK);
          let bid_price    = JSON.parse(parseMessage[1].BID);          

          if(init) {
            // Init Coinone daemons.
            redisClient.del(REDIS_ASK_HNAME);
            redisClient.del(REDIS_BID_HNAME);

            ask_price.map(item => {
              let calculateVol = item.qty / volumeCalculate;
              redisClient.hset(REDIS_ASK_HNAME,item.price,calculateVol);
            });
            bid_price.map(item => {
              let calculateVol = item.qty / volumeCalculate;
              redisClient.hset(REDIS_BID_HNAME,item.price,calculateVol);
            });   

            init = !init;
          }
          else {
            // only if orderbook diff is exist, save to redis.
            if(parseMessage[1].DIFF.ASK.length > 0) {

              redisClient.del(REDIS_ASK_HNAME);
              ask_price.map(item => {
                let calculateVol = item.qty / volumeCalculate;
                redisClient.hset(REDIS_ASK_HNAME,item.price,calculateVol);
              });

            }

            if(parseMessage[1].DIFF.BID.length > 0) {
              redisClient.del(REDIS_BID_HNAME);
              bid_price.map(item => {
                let calculateVol = item.qty / volumeCalculate;
                redisClient.hset(REDIS_BID_HNAME,item.price,calculateVol);
              });                
            }

          }    

        }
      }
    });
  }
}

module.exports = coinone_API

