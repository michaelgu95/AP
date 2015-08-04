
// Use Parse.Cloud.define to define as many cloud functions as you want.

var GameManager = require('cloud/game_matching.js');

Parse.Cloud.define("joinRandomGame", function(request, response) {
  console.log("Incoming join request from " + request.user);
  
  if (request.user) {
    GameManager.joinAnonymousGame(request.user, {
      success: function(match, isTurn) {
        response.success(match, isTurn);
      },
      error: function(error) {
        console.log(error);
        response.error("An error has occured.");
      }
    });
  } else {
    response.error("Authentication failed");
  }
});

Parse.Cloud.define("joinGame", function(request,response) {
   console.log("Attempting to join game:" + request.params.game);
     
   if(request.user){
      var playerQuery = new Parse.Query(Parse.User);
      var playerJoining;
      playerQuery.get(match.user, {
        success: function(object) {
          playerJoining = object;
        },
        error: function(object, error) {
          console.error(error);
        }
      }); 
    
      var matchQuery = new Parse.Query(Match);
      matchQuery.equalTo("gameStatus", "waiting");
      matchQuery.equalTo("objectId", match.game);
      matchQuery.find({
        success : function(results){
          if(results.length > 0){
            _log("found game in database with ID:" + match.game);
            

                match.increment("gameLock");
                match.set("player2", playerJoining);
                match.set("gameStatus", "in_progress");

                match.save(null, {
                  success: function(updatedMatch) {
                    console.log("Incremented lock, game data is now: " + JSON.stringify(updatedMatch));
                    // Check if the join succeeded
                    // if (updatedMatch.get(_matchLockKey) <= _matchLockKeyMax) {
                    //   _log("Game lock successful, joining game.", player);
                      
                     
                      
                    //   match.save(null, {
                    //     success: function(newMatch) {
                    //       // Return the game
                    //       var isTurn = newMatch.get(_matchTurnKey) === _matchTurnKeyPlayer2;
                    //       console.log("Game joined, and it isTurn is : " + isTurn);
                    //     },
                    //     error: function(error) {
                    //       console.error(error);
                    //     }
                    //   });

                    // } else {
                    //   // If someone else joined game first, give up and create new one
                    //   console.error("COLLISION");
                    // }
                  }, 
                  error: function(error){
                    console.error(error);
                  } 
                });


          }else {
            console.log("Could not find game");
          }
        }, 
        error: function(error){
          console.log("Could not find game");
        }
      })
   }
  
})