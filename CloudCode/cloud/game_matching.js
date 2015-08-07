var _matchClassName = "Game";
var _matchLockKey = "gameLock";
var _matchLockKeyInitial = 1;
var _matchLockKeyMax = 2;
var _matchPlayer1Key = "player1";
var _matchPlayer2Key = "player2";
var _matchStatusKey = "gameStatus";
var _matchStatusKeyWaiting = "waiting";
var _matchStatusKeyInProgress = "in_progress";
var _matchStatusKeyFinished = "finished";
var _matchStatusKeyCancelled = "cancelled";
var _matchTurnKey = "turn";
var _matchTurnKeyPlayer1 = "player_1";
var _matchTurnKeyPlayer2 = "player_2";


var player = null;
var subject = null;
var Match = Parse.Object.extend(_matchClassName);

exports.joinGame = function(user, subject) {
    player = user;
    subject = subject;
    return _until(_joinMatchAttempt);
};

_until = function(fn) {
    return fn().then(function (result) {
        if (result !== null) {
            return Parse.Promise.as(result);
        }
        return _until(fn);
    }, function(error){
        return Parse.Promise.error(error);
    });
};

_joinMatchAttempt = function() {
    var matchQuery = new Parse.Query(Match);
    matchQuery.equalTo(_matchStatusKey, _matchStatusKeyWaiting);
    matchQuery.equalTo("subject", subject);
    matchQuery.notEqualTo(_matchPlayer1Key, player); // Can't play with yourself..... well you can, but...
    matchQuery.limit(1);

    return matchQuery.find().then(function(results){
        var match = results[0];
        if (match !== null) {
            match.increment(_matchLockKey);
            return match.save();
        } else {
            return Parse.Promise.error("no games left");
        }
    }).then(function(updatedMatch){
            if (updatedMatch.get(_matchLockKey) <= _matchLockKeyMax) {
                updatedMatch.set(_matchPlayer2Key, player);
                updatedMatch.set(_matchStatusKey, _matchStatusKeyInProgress);
                return updatedMatch.save();
            } else {
                return Parse.Promise.as(null);
            }
     });

};