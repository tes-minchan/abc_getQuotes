let CoinoneAPI = require('coinone_API');
let UpbitAPI = require('upbit_API');
let BithumbAPI = require('bithumb_API');
let KorbitAPI = require('korbit_API');
let GopaxAPI = require('gopax_API');
let CoinnestAPI = require('coinnest_API');
let ExchangesAPI = require('exchanges_API');
let PoloniexAPI = require('poloniex_API');
let BitfinexAPI = require('bitfinex_API_WS');

/*
  **** Websocket API GET ****
*/

var coinoneAPI = new CoinoneAPI('BTC');
var redisSave_coinone = true;
coinoneAPI.connect(redisSave_coinone);

var upbitAPI = new UpbitAPI();
var redisSave_upbit = true;
upbitAPI.connect(redisSave_upbit);

var bitfinexAPI = new BitfinexAPI();
bitfinexAPI.connect();

/*
  **** REST API GET ****
*/

var bithumbAPI = new BithumbAPI();
bithumbAPI.getOrderbook();

var korbitAPI = new KorbitAPI();
korbitAPI.getOrderbook();

var gopaxAPI = new GopaxAPI();
gopaxAPI.getOrderbook();

var coinnestAPI = new CoinnestAPI();
coinnestAPI.getOrderbook();

var exchangesAPI = new ExchangesAPI();
exchangesAPI.getExchanges();

var poloniexAPI = new PoloniexAPI();
poloniexAPI.getOrderbook();
