var async = require('async');
var db = require('../lib/db')
var arbitrage = require('../lib/dbquery/arbitrage');

module.exports = {


  updateArbitrage: function(infromation, callback) {

    async.waterfall([
      db.getConnection,
      db.beginTRX,
      async.apply(arbitrage.dbUpdateArbitrage, infromation),
    ], function(err, connection, result){
      if(err) {
        db.doRollback(connection, function(){
          connection.release();
          callback(err);
        });
      }
      else {
        connection.commit(function (err) {
          if (err) {
              connection.rollback(function () {
                connection.release();
                callback(err);
              });
          }
          else {
            connection.release();
            callback(null);
          }
        });

      }
    });



  },

}