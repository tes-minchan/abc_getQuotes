const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3600 });

const bluebird = require('bluebird');
const Config = require('./config');
const MarketConfig = require("./config/market");
const Redis = require('redis');
const OrderbookController = require('./lib/websocket/controller');

// enviroments setting.
const redisClient = Redis.createClient(Config.redisConfig);
bluebird.promisifyAll(Redis);

// Process exception 
process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});

// Listening to Web connection.
wss.on('connection', function connection(ws) {
  console.log("new connection");

  ws.on('close', function close() {
    console.log('disconnected');
  });

  ws.on('message', function incoming(data) {
    let parseJson = JSON.parse(data);
    _checkOnMessage(ws, parseJson);
  });

  // Send market quotes.
  setInterval(function() {


    if(ws.subscribe_orderbook_coin) {

      // Orderbook subscribe
      let response = {
        type : 'orderbook',
        data : null
      }

      OrderbookController.getOrderbook(ws.subscribe_orderbook_coin, function(result) {
        OrderbookController.parseOrderbook(result, ws.subscribe_market, function(result) {
          response.data = result;
          if(ws.readyState === 1) {
            ws.send(JSON.stringify(response));
          }
        });
      });
    }
    else if (ws.subscribe_dashboard) {

      // Aritrage subscribe
      const subscribe_coinlist = ws.subscribe_dashboard;

      let response = {
        type       : 'update_dashboard'
      };
      _getArbitrage(subscribe_coinlist, function(result) {
        response['orderbook'] = result;
        if(ws.readyState === 1) {
          ws.send(JSON.stringify(response));
        }
      });
    }
    

  },1000);
  
});


async function _checkMarketDown(cb) {
  let checkRedisTable = [];
  let checkResult = [];

  Config.marketInfo.krw_market.map(market => {
    checkRedisTable.push(['get',`${market}_HEARTBEAT`]);
  });

  redisClient.multi(checkRedisTable).exec((error, values) => {
    values.forEach((result,index) => {
      checkResult.push({
        market : checkRedisTable[index][1].split('_')[0],
        status : result
      });
    });

    cb(checkResult);

  });

}

function _initCoinList() {

  let coinlist = [];

  // UPBIT Market Coin is base currency
  for(let coin of MarketConfig.UPBIT.coin_list) {
    let coinInfo = {
      name : coin,
      support_market : ['UPBIT'],
      count : 1
    }

    MarketConfig.BITHUMB.coin_list.forEach(bithumb_coin => {
      if(bithumb_coin === coin){
        coinInfo.support_market.push('BITHUMB');
        coinInfo.count++;
        return;
      }
    });

    MarketConfig.GOPAX.coin_list.forEach(gopax_coin => {
      if(gopax_coin === coin){
        coinInfo.support_market.push('GOPAX');
        coinInfo.count++;
        return;
      }
    });

    MarketConfig.CASHIEREST.coin_list.forEach(cashier_coin => {
      if(cashier_coin === coin){
        coinInfo.support_market.push('CASHIEREST');
        coinInfo.count++;
        return;
      }
    });

    MarketConfig.COINONE.coin_list.forEach(coinone_coin => {
      if(coinone_coin === coin){
        coinInfo.support_market.push('COINONE');
        coinInfo.count++;
        return;
      }
    });

    if(coinInfo.count > 1) {
      coinlist.push(coinInfo);
    }

  }

  return coinlist;
}


function _checkOnMessage(ws, message) {

  const type = message.channel;

  if(type === 'init_dashboard') {
    let response = {
      type       : 'init_dashboard',
      marketList : Config.marketInfo.krw_market,
      coinList   : _initCoinList()
    };

    ws.send(JSON.stringify(response));
  }
  else if(type === 'update_dashboard') {
    ws.subscribe_dashboard = message.subscribe;
  }
  else if(type === 'subscribe_orderbook') {

    ws.subscribe_orderbook_coin = message.currency;
    ws.subscribe_market         = message.subscribe_market;
    console.log(message.subscribe_market);
  }
  else if(type === 'market_status') {

    let response = {
      type : 'market_status',
      status : null
    };

    _getMarketStatus(result => {
      response.status = result;
      ws.send(JSON.stringify(response));

    });



  }
}

function _getMarketStatus(callback) {
  let checkRedisTable = [];
  let checkResult = [];

  Config.marketInfo.krw_market.map(market => {
    checkRedisTable.push(['get',`${market}_HEARTBEAT`]);
  });

  redisClient.multi(checkRedisTable).exec((error, values) => {
    values.forEach((result,index) => {
      checkResult.push({
        market : checkRedisTable[index][1].split('_')[0],
        status : result
      });
    });

    callback(checkResult);

  });
}

function _getArbitrage(subscribe_coinlist, callback) {
  if(subscribe_coinlist) {
    _processAsyncArr(subscribe_coinlist, function(result) {
      callback(result)
    });
  }
  else {

    let coinList = _initCoinList();
    _processAsyncArr(coinList, function(result) {
      callback(result)
    });
  }



}

async function _processAsyncArr(array, callback) {

  let arbList = [];
  for(const item of array) {
    let result = await _getCoinARB(item);
    arbList.push(result);
  }

  callback(arbList)
}

function _getCoinARB(coinInfo) {

  return new Promise((resolve, reject)=> {
    // console.log(coinInfo)
    let askRedisTable = coinInfo.ASK.support_market.map(item => {
      return (`${item}_${coinInfo.name}KRW_ASK`);
    });
    askRedisTable = askRedisTable.map(askTable => {
      return ['hgetall', askTable];
    });

    let bidRedisTable = coinInfo.BID.support_market.map(item => {
      return (`${item}_${coinInfo.name}KRW_BID`);
    });
    bidRedisTable = bidRedisTable.map(bidTable => {
      return ['hgetall', bidTable];
    });

    let toSendMsg = {};
    toSendMsg['COIN'] = coinInfo.name;
    toSendMsg['ASK_MARKET_COUNT'] = coinInfo.ASK.count;
    toSendMsg['BID_MARKET_COUNT'] = coinInfo.BID.count;


    _getAskARB(askRedisTable, function(error, askARB) {
      toSendMsg['ASK'] = askARB;
      _getBidARB(bidRedisTable, function(error, bidARB) {
        toSendMsg['BID'] = bidARB;  
        if(toSendMsg) {

          resolve(toSendMsg);
        } 
        else {
          reject(null);
        }     
      })
    });
  });
}


function _getAskARB(redis_table, callback) {

  let toBuyMarket = {
    market : "",
    minAsk : 0,
    volume : 0
  };

  redisClient.multi(redis_table).exec((error, values) => {

    let index  = 0;
    for(let askOrderbook of values) {
      if(!askOrderbook) {
        index++;
        return;
      }
      let price  = Object.keys(askOrderbook);
      let volume = Object.values(askOrderbook);
      let market = redis_table[index][1].split('_')[0];

      if(index++ < 1) {
        toBuyMarket.market = market;
        toBuyMarket.minAsk = price[0];
        toBuyMarket.volume = volume[0];
      }
      else {
        if( Number(price[0]) < Number(toBuyMarket.minAsk) ) {
          toBuyMarket.market = market;
          toBuyMarket.minAsk = price[0];
          toBuyMarket.volume = volume[0];
        }
      }
    }

    callback(null, toBuyMarket);
  });
}


function _getBidARB(redis_table, callback) {

  let toSellMarket = {
    market : null,
    maxBid : 0,
    volume : 0
  };

  redisClient.multi(redis_table).exec((error, values) => {

    let index  = 0;
    for(let bidOrderbook of values) {
      if(!bidOrderbook) {
        index++;
        return;
      }
      let market = redis_table[index][1].split('_')[0];
      let price  = Object.keys(bidOrderbook);
      let volume = Object.values(bidOrderbook);
      let [price_length, volume_length] = [price.length-1, volume.length-1];
  
      if(index++ < 1) {
        toSellMarket.market = market;
        toSellMarket.maxBid = price[price_length];
        toSellMarket.volume = volume[volume_length];
      }
      else {
        if( Number(price[price_length]) > Number(toSellMarket.maxBid) ) {
          toSellMarket.market = market;
          toSellMarket.maxBid = price[price_length];
          toSellMarket.volume = volume[volume_length];;
        }
      }

    }
    callback(null, toSellMarket);   


  });
}