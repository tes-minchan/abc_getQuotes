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

// npm modules.
const WSCLINET = require('ws-reconnect');
const REDIS    = require('redis');

// custom module or config.
const CONFIG           = require('../config');
const MARKET_CONFIG    = require('../config/market').UPBIT;


/**
* @description Upbit Websocket Object
*/

function UpbitWS () {

  this.Market       = "UPBIT";
  this.WebsocketURL = "wss://api.upbit.com/websocket/v1";

}

UpbitWS.prototype.connect = function() {

  const self        = this;
  const wsclient    = new WSCLINET(this.WebsocketURL, MARKET_CONFIG.connection_option);
  const redisClient = REDIS.createClient(CONFIG.redisConfig);

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected`);

    let ticket = {
      "ticket" : "getQuotes"
    };
    
    let currencyList = MARKET_CONFIG.coin_list.map(coin => {
      return `KRW-${coin}`
    });
  
    let type = {
      "type" : "orderbook",
      "codes" : currencyList,
      "isOnlySnapshot" : false
    }

    // Set to subscribe currency informations.
    let subscribe = [];
    subscribe.push(ticket);
    subscribe.push(type);
    subscribe = JSON.stringify(subscribe);

    wsclient.socket.send(subscribe);

  });

  wsclient.on("message",function(get_data){
    let parseData = JSON.parse(get_data.toString());

    let splitCurrency = parseData.code.split('-');

    const RedisAskHashTable = `${self.Market}_${splitCurrency[1]}${splitCurrency[0]}_ASK`;
    const RedisBidHashTable = `${self.Market}_${splitCurrency[1]}${splitCurrency[0]}_BID`;

    redisClient.del(RedisAskHashTable);
    redisClient.del(RedisBidHashTable);

    parseData.orderbook_units.forEach(orderbook => {
      redisClient.hset(RedisAskHashTable,orderbook.ask_price,orderbook.ask_size);
      redisClient.hset(RedisBidHashTable,orderbook.bid_price,orderbook.bid_size);
    });

  });

}

/**
* @description Upbit Websocket Status Check
* @param 
*/

UpbitWS.prototype.checkHeartBeat = function() {

  const self     = this;
  const wsclient = new WSCLINET(this.WebsocketURL, MARKET_CONFIG.connection_option);

  const RedisHeartBeatTable = `${this.Market}_HEARTBEAT`;
  const redisClient         = REDIS.createClient(CONFIG.redisConfig);

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected, HeartBeat Check`);
    redisClient.set(RedisHeartBeatTable, true);

  });
  
  wsclient.on("reconnect",function(){
    console.log(`${self.Market} Websocket Reconnecting...`);
    redisClient.set(RedisHeartBeatTable, false);

  });

}


module.exports = UpbitWS;

