let BithumbAPI   = require('bithumb_API');
let KorbitAPI    = require('korbit_API');
let GopaxAPI     = require('gopax_API');
let CoinnestAPI  = require('coinnest_API');
let ExchangesAPI = require('exchanges_API');
let PoloniexAPI  = require('poloniex_API_WS');
let BitfinexAPI  = require('bitfinex_API_WS');
let BitflyerAPI  = require('bitflyer_API_WS');
let CoinoneAPI   = require('coinone_API_WS');
let UpbitAPI     = require('upbit_API_WS');

// COINONE, UPBIT, BITHUMB, KORBIT, GOPAX, BITFINEX, POLONIEX DONE !!!

/*
  **** Websocket API GET ****
*/

var coinoneAPI = new CoinoneAPI();
coinoneAPI.connect('BTC');
coinoneAPI.connect('ETH');
coinoneAPI.connect('EOS');
coinoneAPI.connect('XRP');
coinoneAPI.connect('ZRX');

var upbitAPI = new UpbitAPI();
upbitAPI.connect();

// var bitfinexAPI = new BitfinexAPI();
// bitfinexAPI.connect();

// var poloniexAPI = new PoloniexAPI();
// poloniexAPI.connect();

/*
  **** REST API GET ****
*/

var bithumbAPI = new BithumbAPI();
bithumbAPI.getOrderbook();

var korbitAPI = new KorbitAPI();
korbitAPI.getOrderbook('btc_krw');
korbitAPI.getOrderbook('eth_krw');
korbitAPI.getOrderbook('xrp_krw');

var gopaxAPI = new GopaxAPI();
gopaxAPI.getOrderbook('BTC-KRW');
gopaxAPI.getOrderbook('ETH-KRW');
gopaxAPI.getOrderbook('EOS-KRW');
gopaxAPI.getOrderbook('XRP-KRW');
gopaxAPI.getOrderbook('ZRX-KRW');

// var coinnestAPI = new CoinnestAPI();
// coinnestAPI.getOrderbook();

// var exchangesAPI = new ExchangesAPI();
// exchangesAPI.getExchanges();


