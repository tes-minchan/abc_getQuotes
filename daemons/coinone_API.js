var sleep = require('sleep');
var Redis = require('redis');
var _ = require('underscore');
var WSCLINET = require('ws-reconnect');
var config = require('../config');

const currencyList   = [ 'BTC' ,'BCH' ,'ETH' , 'EOS', 'XRP', 'etc', 'qtum' ,'ltc' ,'iota' ,'btg' ,'omg', 'data', 'zil']
const currencyOption = [ '1000', '500', '1000', '10', '1' ];
const market         = 'COINONE';

function coinone_API (_CURRENCY) {
  var wsclient = new WSCLINET("wss://push.coinone.co.kr/socket.io/?EIO=3&transport=websocket");

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);
  // set currency.
  let CURRENCY = _CURRENCY;
  // set to save redis hash table name.
  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  // utils
  const isCurrency = function (c) {
    return currencyList.indexOf(c) !== -1
  }

  const getCurrencyIndex = function () {
    return currencyList.indexOf(CURRENCY)
  }

  // public methods
  this.getCurrency = function() {
    return currencyList;
  }

  // websocket methods.
  this.connect = function(enable_save) {
    // Allowed values: btc, bch, btg, eth, etc, xrp, qtum, iota, ltc
    if (!isCurrency(CURRENCY)) {  
      console.error('currency is NOT right value: btc, bch, btg, eth, etc, xrp, qtum, iota, ltc', CURRENCY)
      return false
    }

    // websocket client start.
    wsclient.start();

    wsclient.on("connect",function(connection){
      console.log(market + ' Websocket Client Connected');

      let subscribe = '40/orderbook';
      wsclient.socket.send(subscribe);
      // set websocket send term.
      sleep.msleep(500);
      // subscribe orderbook.
      subscribe = '42/orderbook,["subscribe", "' + CURRENCY + '", ' + currencyOption[getCurrencyIndex()] + ']';
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
      
      if(msg.search('orderbook') !== -1) {

        var split = msg.split('/');

        if(split[0] === '42') {

          var parseMessage = JSON.parse(msg.replace('42/orderbook,',''));
          let ask_price    = JSON.parse(parseMessage[1].ASK);
          let bid_price    = JSON.parse(parseMessage[1].BID);          

          if(enable_save) {

            // only if orderbook diff is exist, save to redis.
            if(parseMessage[1].DIFF.ASK.length > 0) {

              redisClient.del(REDIS_ASK_HNAME);
              _.map(ask_price, function(item) {
                redisClient.hset(REDIS_ASK_HNAME,item.price,item.qty);
              });
            }

            if(parseMessage[1].DIFF.BID.length > 0) {
              redisClient.del(REDIS_BID_HNAME);
              _.map(bid_price, function(item) {
                redisClient.hset(REDIS_BID_HNAME,item.price,item.qty);
              });
            }

          }

        }
      }
    });
  }
}

module.exports = coinone_API

