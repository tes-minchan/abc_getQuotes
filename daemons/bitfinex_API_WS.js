let _ = require('underscore');
let Redis = require('redis');
var WSCLINET = require('ws-reconnect');
var wsclient = new WSCLINET("wss://api.bitfinex.com/ws/2");
var config = require('../config');

const market = 'BITFINEX';

function bitfinex_API () {

  // connect to redis server.
  let redisClient = Redis.createClient(config.redisConfig);

  let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
  let REDIS_BID_HNAME = market + '_BTCKRW_BID';

  
  redisClient.del(REDIS_ASK_HNAME);
  redisClient.del(REDIS_BID_HNAME);
  // websocket methods.
  this.connect = function(enable_save) {
    // websocket client start.
    wsclient.start();

    wsclient.on("connect",function(connection) {
      console.log(market + ' Websocket Client Connected');

      var ticket = {
        "event"  : "subscribe",
        "channel" : "book",
        "pair"    : "BTCUSD",
        "prec"    : "R0"
      }
      var ticket2 = {
        "event": "subscribe",
        "channel": "book",
        "symbol": ["tBTCUSD","ASK"],
        "prec": "P0",
        "freq": "F0",
        "len": 25
      }
      let msg = JSON.stringify({ 
        event: 'subscribe', 
        channel: 'book', 
        symbol: 'tBTCUSD' 
      })

      wsclient.socket.send(msg);

    });

    wsclient.on("destroyed",function() {
      console.log("destroyed");
    });

    wsclient.on("reconnect",function() {
      console.log("reconnecting");
    });

    wsclient.on("message",function(data) {
      var parseJson = JSON.parse(data.toString());

      if(parseJson[1] === undefined || parseJson[1] === 'hb') {
        return;
      }

      let ObjLength = Object.keys(parseJson[1]).length;;


      // redisClient.hset(REDIS_ASK_HNAME,'8172.2','1.3');



      if(ObjLength > 3) {
        // Init orderbooks.

        parseJson.map((getData,index) => {
          if(index == 1) {
            getData.map(orderbook => {
              if(orderbook[2] > 0) {
                redisClient.hset(REDIS_BID_HNAME,orderbook[0],orderbook[2]);
              }
              else {
                redisClient.hset(REDIS_ASK_HNAME,orderbook[0],orderbook[2]);
              }
            })
          }
        });

        
      }
      else {
        // Update orderbook.
        let getOrderbook = parseJson[1];
        let [price,count,amount] = [getOrderbook[0],getOrderbook[1],getOrderbook[2]];

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
              redisClient.hset(REDIS_ASK_HNAME,price,amount);
            }
            else {
              redisClient.hset(REDIS_ASK_HNAME,price,amount);
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
           redisClient.hdel(REDIS_BID_HNAME, price,redisClient.print);
         }
         else {
           redisClient.hdel(REDIS_ASK_HNAME, price, redisClient.print);
         }
        }

      }

    });
  }  

}

module.exports = bitfinex_API
