const Arbitrage  = require('./daemons/arbitrage');

let arbitrage = new Arbitrage();

setInterval(() => {
  arbitrage.getOrderbook(arbitrage.redisTable.BTC, "BTC");
  arbitrage.getOrderbook(arbitrage.redisTable.ETH, "ETH");
  arbitrage.getOrderbook(arbitrage.redisTable.EOS, "EOS");
  arbitrage.getOrderbook(arbitrage.redisTable.XRP, "XRP");
  arbitrage.getOrderbook(arbitrage.redisTable.ZRX, "ZRX");
  // arbitrage.getOrderbook(arbitrage.redisTable.LOOM, "LOOM");

},100);





