/*
*  *** Poloniex API Version 2 ***
*
*  1. Reference Site : https://poloniex.com/support/api/
*
*/

let _ = require('underscore');
let Redis = require('redis');
var WSCLINET = require('ws-reconnect');
var wsclient = new WSCLINET("wss://api2.poloniex.com");
var config = require('../config');
const market       = 'POLONIEX';

// connect to redis server.
let redisClient = Redis.createClient(config.redisConfig);

let REDIS_ASK_HNAME = market + '_BTCKRW_ASK';
let REDIS_BID_HNAME = market + '_BTCKRW_BID';

redisClient.del(REDIS_ASK_HNAME);
redisClient.del(REDIS_BID_HNAME);

wsclient.start();

wsclient.on("connect",function(connection) {
  console.log(market + ' Websocket Client Connected');

  var ticket = {
    "command": "subscribe",
    "channel": 121
  }

  // Set to subscribe currency informations.
  wsclient.socket.send(JSON.stringify(ticket));

});

wsclient.on("message",function(data) {
  var parseJson = JSON.parse(data);
  
  if(parseJson[0] === 1010) {
    return;
  }

  if(parseJson[2][0][0] === 'i') {
    let Ask_OrderBook = parseJson[2][0][1].orderBook[0];
    let Bid_OrderBook = parseJson[2][0][1].orderBook[1];


    _.map(Ask_OrderBook,function(size, price){
      redisClient.zadd(REDIS_ASK_HNAME,price,size);
    })

    _.map(Bid_OrderBook,function(size, price){
      redisClient.zadd(REDIS_BID_HNAME,price,size);
    })

  }
  else {
    let openOrders = parseJson[2];

    for(index in openOrders) {
      // console.log(openOrders[index]);

      let book_type  = openOrders[index][0]; 

      if(book_type === 'o') {
        let order_type = openOrders[index][1]; 
        let price      = openOrders[index][2];
        let size       = openOrders[index][3];
        console.log(price);
        redisClient.zscan(REDIS_ASK_HNAME, 0, 'MATCH', price.toString(),  function(err, result) {
          console.log("ASK");
          console.log(result);
        });
        redisClient.zscan(REDIS_BID_HNAME, 0, 'MATCH', price.toString(),  function(err, result) {
          console.log("BID");
          console.log(result);
        });
        // console.log(book_type,order_type,price,size);

      }
      else {
        let order_type = openOrders[index][2]; 
        let price      = openOrders[index][3];
        let size       = openOrders[index][4];

        // console.log(book_type,order_type,price,size);
      }

    }

  }
});
