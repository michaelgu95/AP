
// Use Parse.Cloud.define to define as many cloud functions as you want.

var GameManager = require('cloud/game_matching.js');

Parse.Cloud.define("joinGame", function(request, response) {
  console.log("Incoming join request from " + request.userId);
  
  if (request.user) {
    var user;
    var query = new Parse.Query(Parse.User);
    query.equalTo("objectId", request.userId);
    query.find().then(function(results){
      user = results[0];
    })
    GameManager.joinGame(user, request.subject).then(function(result){
      if(result !==null){
        response.success(result);
      }
    }, function(error){
        response.error(error);
    });  
  }else {
    response.error("No _User Object in arguments");
  }
});

Parse.Cloud.define('findOpponent', function(request, response){
  //find opponent
  var opQuery = new Parse.Query('_User');
  var opponent;
  opQuery.notEqualTo("objectId", request.userId);
  opQuery.equalTo("searchingFor", request.subject)
  opQuery.equalTo("status", "finding");
  opQuery.first({
    success : function(object){
      object.set("status", "playing");
      object.save();
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });
  //find me
  var meQuery = new Parse.Query('_User');
  var me;
  meQuery.equalTo("objectId", request.userId);
  meQuery.first({
    success : function(object){
      object.set("status", "playing");
      object.save();
    },
    error : function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  })

  response.success("successfully found opponent");
  // if(opponent.get("status") == "finding" 
  //   && me.get("status") == "finding"){
  //   me.set("status", "playing");
  //   me.set("status", "playing");
  //   //query questions, create game and save users/questions to game
  //   var Game = Parse.Object.extend("Game");
  //   var game = new Game();
  //   var questions = new Array();
  //   response.success("successfully found match!");
  // }




})

