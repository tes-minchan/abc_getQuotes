const Config = require('../config');
const Orderbook = require('../lib/quotes/Orderbook');
const orderbook = new Orderbook(100);

Config.orderbook.support_coin.forEach(coin => {
  orderbook.create(coin);
});

