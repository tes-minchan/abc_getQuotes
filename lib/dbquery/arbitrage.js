var db = require('../db')
var ERR_MSG = {
  title : null,
  description : null
}

module.exports = {

  dbUpdateArbitrage: function(info, connection, callback) {
    var sql_query = "INSERT INTO arbitrage (curr_time, coin, ask_market, ask_price, ask_volume, bid_market, bid_price, bid_volume, fiat_funds, fiat_profit, coin_funds, coin_profit, percentage) ";
    sql_query    += "VALUES(NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    var params = [info.coin, info.askMarket, info.askPrice, info.askVol, info.bidMarket, info.bidPrice, info.bidVol, info.reqFiatFunds, info.fiatProfit, info.reqCoinFunds, info.coinProfit, info.percentage];

    db.doQuery(
      connection
      , sql_query
      , params
      , function(err, connection, results) {
          if (err) {
            console.log(err);
            console.log("[Internal][ERROR] dbUpdateArbitrage func");
            callback(err, connection);
          } 
          else {
            callback(null, connection);
          }
        }
    );

  },

  


}