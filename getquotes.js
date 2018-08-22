const MARKET_CONFIG = require('./config/market');
const Coinone     = require('./lib/quotes/Coinone');
const Upbit       = require('./lib/quotes/Upbit');
const Bithumb     = require('./lib/quotes/Bithumb');
const Gopax       = require('./lib/quotes/Gopax');
const Cashierest  = require('./lib/quotes/Cashierest');


/**  
  * @description 
  * *** COINONE ORDERBOOK PARSING FROM WEBSOCKET.
  * 
  * @returns 
  *   40 : response from server 
  *   42 : orderbook
*/ 



const coinone_ws = new Coinone();
coinone_ws.checkHeartBeat();

MARKET_CONFIG.COINONE.coin_list.forEach(coin => {
  coinone_ws.connect(coin,'KRW');
});



/**  
  * @description 
  * *** UPBIT ORDERBOOK PARSING FROM WEBSOCKET.
  * BITHUMB, COINONE, GOPAX, CASHEREST에서 하나라도 지워하는 코인만 support
  * @returns 
*/ 

const upbit_ws = new Upbit();
upbit_ws.connect();
upbit_ws.checkHeartBeat();

/**  
  * @description 
  * *** CASHIEREST ORDERBOOK PARSING FROM WEBSOCKET.
  * @returns 
*/ 

const cashierest_ws = new Cashierest();
cashierest_ws.connect();
cashierest_ws.checkHeartBeat();


/**  
  * @description 
  * *** BITHUMB ORDERBOOK PARSING FROM REST API.
  * @returns 
*/ 

const bithumb_api = new Bithumb();
bithumb_api.connect();

/**  
  * @description 
  * *** GOPAX ORDERBOOK PARSING FROM REST API.
  * @param {COIN_NAME}
  * @returns 
*/ 

const gopax_api = new Gopax();
MARKET_CONFIG.GOPAX.coin_list.forEach(coin => {
  gopax_api.connect(coin);
});







