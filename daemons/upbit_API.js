let _ = require('underscore');
let Redis = require('redis');
var sleep = require('sleep');
var WSCLINET = require('ws-reconnect');
var wsclient = new WSCLINET("wss://api.upbit.com/websocket/v1");
var config = require('../config');

const currencyList = [ 'KRW-BTC' ];
const market       = 'UPBIT';

function upbit_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  // utils
  const isCurrency = function (c) {
    return currencyList.indexOf(c) !== -1
  }

  const getCurrencyIndex = function (c) {
    return currencyList.indexOf(c)
  }

  // public methods
  this.getCurrency = function() {
    return currencyList;
  }
  
  // websocket methods.
  this.connect = function(enable_save) {
    // websocket client start.
    wsclient.start();

    wsclient.on("connect",function(connection) {
      console.log(market + ' Websocket Client Connected');

      var ticket = {
        "ticket" : "test"
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

      if(enable_save) {

         // set to save redis hash table name.
        let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
        let REDIS_BID_HNAME = market + '_BTCKRW_BID';

        redisClient.del(REDIS_ASK_HNAME);
        redisClient.del(REDIS_BID_HNAME);

        _.map(parseJson.orderbook_units, function(item) {
          redisClient.hset(REDIS_ASK_HNAME,item.ask_price,item.ask_size.toFixed(3));
          redisClient.hset(REDIS_BID_HNAME,item.bid_price,item.bid_size.toFixed(3));
        });  

      }

    });
  }  
  
  this.saveOrderbook = function() {

    _.map(orderbook, function(item) {
      redisClient.hset('upbit_orderbook_bid',item.bid_price,item.bid_size);

    });
  }


}

module.exports = upbit_API
