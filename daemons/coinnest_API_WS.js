var WSCLINET = require('ws-reconnect');
var wsclient = new WSCLINET("wss://www.coinnest.co.kr/socket");
const market = "COINNEST";

// websocket methods.
function main() {
  // websocket client start.
  wsclient.start();

  wsclient.on("connect",function(connection) {
    console.log(market + ' Websocket Client Connected');

    wsclient.socket.send("market-allcoin");

  });

  wsclient.on("destroyed",function() {
    console.log("destroyed");
  });

  wsclient.on("reconnect",function() {
    console.log("reconnecting");
  });

  wsclient.on("message",function(data) {
    // console.log(data);
    console.log(data.toString('ASCII'));

  });
}  

main();