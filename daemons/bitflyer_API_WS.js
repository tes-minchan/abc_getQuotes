// wss://ws.lightstream.bitflyer.com/json-rpc

let Redis = require('redis');
var WSCLINET = require('ws-reconnect');
var wsclient = new WSCLINET("wss://ws.lightstream.bitflyer.com/json-rpc");
var config = require('../config');

const market = 'BITFLYER';

function bitflyer_API () {

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

      // const channelName = "lightning_board_snapshot_BTC_JPY";
      const channelName = "lightning_board_BTC_JPY";

      let msg = JSON.stringify({
        method: "subscribe",
        params: {
          channel: channelName
        },
        id: 123
      });

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
      if(!parseJson.id) {

        console.log(parseJson.params.message.bids);
      }
    });

  }


}


module.exports = bitflyer_API
