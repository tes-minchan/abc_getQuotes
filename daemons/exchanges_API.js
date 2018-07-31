var client = require('cheerio-httpcli');
let Redis  = require('redis');
var config = require('../config');
let redisClient = Redis.createClient(config.redisConfig);

var code = 'USDKRW=X';
var url = "http://finance.yahoo.com/q";

function exchanges_API () {
  
  this.getExchanges = function() {
    setInterval(function(){

      client.fetch(url, {
      		"s": code
      }, function(err, $, res) {
      	if (err) {
      		console.log(err);
      		return;
      	}
      	var str = $('#quote-header-info > div > div > div > span:nth-child(1)').text();
      	str = str.replace(/,/g, "");
      	str = str.substring(str.indexOf('KRW'), str.length);

        var arr = str.match(/\d*\.\d*/);
        redisClient.set('EXCHANGES_USDKRW',arr[0]);
      });
    },30000);
  }

}

module.exports = exchanges_API
