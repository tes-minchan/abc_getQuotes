/*
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
 *                               CASHIEREST WEBSOCKET API
 *   GENERAL DESCRIPTION
 *     Get quotes from websocket. 
 * 
 *   REFERENCE WEBSITE
 *     None.
 *
 *   SUPPORTED CURRENCY
 *     777 WE KNC DENT PAY MEDX EOS HOT CNN TRX DASH ZIL BCH ZRX PPT BTC eosDAC SNT MCO ETH MVL NPXS WAX INC WAB ATX
 * 
 *   CREATED DATE, 2018.08.17
 *   *====*====*===*====*====*====*====*====*====*====*====*====*====*====*====*
*/


// npm modules.
const WSCLINET = require('ws-reconnect');
const REDIS    = require('redis');

// custom module or config.
const CONFIG           = require('../../config');
const MARKET_CONFIG    = require('../../config/market').CASHIEREST;


function CashierestWS () {

  this.Market       = "CASHIEREST";
  this.WebsocketURL = "wss://www.cashierest.com/signalr/connect?transport=webSockets&clientProtocol=1.5&connectionToken=9XaN1HvSrvIqa9%2FDMEG%2BN%2F1pMuJkh%2FeMu8jfHdnrrfWeqRMYKfcTsVUQaL7s6Z0XBG0BXOx7ENaYEE8m1vIJeQ36XjQHgIZnx0qp%2FNbPHpiFtl7%2FiNFIu0LdsMcHqcFd&connectionData=%5B%7B%22name%22%3A%22stockcoinbuyticker%22%7D%2C%7B%22name%22%3A%22stockcoinsellticker%22%7D%2C%7B%22name%22%3A%22stockcointicker%22%7D%2C%7B%22name%22%3A%22stockcointurnoverticker%22%7D%5D&tid=5";
  this.redisClient  = REDIS.createClient(CONFIG.redisConfig);

}

CashierestWS.prototype.connect = function() {

  const self = this;  

  const wsclient    = new WSCLINET(this.WebsocketURL, MARKET_CONFIG.connection_option);

  // websocket client start.
  wsclient.start();

  wsclient.on("connect", function(connection){
    console.log(`${self.Market} Websocket Client Connected `);

    let subscribe = '40/orderbook';
    wsclient.socket.send(subscribe);

    subscribe = {H: "stockcoinbuyticker", M: "GetAllStocks", A: [], I: 1}
    wsclient.socket.send(JSON.stringify(subscribe));

    subscribe = {H: "stockcoinsellticker", M: "GetAllStocks", A: [], I: 2}
    wsclient.socket.send(JSON.stringify(subscribe));

  });

  wsclient.on("message",(data) => {
    let parseJson = JSON.parse(data.toString());

    if(parseJson.R) {
      /** 
       * Init orderbook.
       * @param type Orderbook Type (1 : BID, 2 : ASK)
       * @param coinList {object} All coin list, included all coin info.
      */
     let coinList = parseJson.R;

      if(parseJson.I === '1') {
        // Create BID Redis Table
        coinList.forEach(element => {
          _InitRedisTable(self, element, parseJson.I);
        });
      }
      else {
  
        // Create ASK Redis Table
        coinList.forEach(element => {
          _InitRedisTable(self, element, parseJson.I);
        });
      }

    }
    else if(parseJson.M) {
      let updateOrderbook = parseJson.M[0];
      if(updateOrderbook) {
        if (updateOrderbook.H === "stockCoinBuyTicker") {
          _UpdateRedisTable(self, updateOrderbook.A[0], "BID");
        }
        else if (updateOrderbook.H === "stockCoinSellTicker") {
          _UpdateRedisTable(self, updateOrderbook.A[0], "ASK");

        }
      }

    }
    
  });

}

CashierestWS.prototype.checkHeartBeat = function() {

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

function _InitRedisTable(self, orderbook, type) {

  if(type === '1') {
    const RedisBidHashTable = `${self.Market}_${orderbook.CoinCode}KRW_BID`;
    self.redisClient.del(RedisBidHashTable);

    orderbook.CoinBuySum.forEach(item => {
      self.redisClient.hset(RedisBidHashTable, item.CoinPrice, item.CoinMoneySurplus);
    });
  }
  else {

    const RedisAskHashTable = `${self.Market}_${orderbook.CoinCode}KRW_ASK`;
    self.redisClient.del(RedisAskHashTable);

    orderbook.CoinSellSum.forEach(item => {
      self.redisClient.hset(RedisAskHashTable, item.CoinPrice, item.CoinMoneySurplus);
    });
  }

}

function _UpdateRedisTable(self, orderbook, type) {

  if(type === 'BID') {
    const RedisBidHashTable = `${self.Market}_${orderbook.CoinCode}KRW_BID`;
    self.redisClient.del(RedisBidHashTable);

    orderbook.CoinBuySum.map(item => {
      self.redisClient.hset(RedisBidHashTable,item.CoinPrice,item.CoinMoneySurplus);
    });

  }
  else {
    const RedisAskHashTable = `${self.Market}_${orderbook.CoinCode}KRW_ASK`;
    self.redisClient.del(RedisAskHashTable);
    
    orderbook.CoinSellSum.map(item => {
      self.redisClient.hset(RedisAskHashTable,item.CoinPrice,item.CoinMoneySurplus);
    });
  }

  
}




module.exports = CashierestWS;