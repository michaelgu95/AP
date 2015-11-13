angular.module('app.services', [])
  .factory('socket',function(socketFactory){
        //Create socket and connect to http://chat.socket.io 
         var myIoSocket = io.connect('https://floating-everglades-6359.herokuapp.com/');
         // var myIoSocket = io.connect('http://localhost:3000');

          mySocket = socketFactory({
            ioSocket: myIoSocket
          });

        return mySocket;
    })

	.service('GameRoomService', function(){
		 return {
		 	getGames : function($scope) {
		 			var games = new Array();
			    	var Game = Parse.Object.extend("Game");
			    	var query = new Parse.Query(Game);
			    	query.notEqualTo("creator", Parse.User.current());
			    	query.find().then(function(results){
			    		$scope.$apply(function(){
			    			for(i in results) {
			    				var obj = results[i];
			    				var users = obj.get("users");
			    				var subject = obj.get("subject");
			    				var id = obj.get("objectId");
			    				var questions = obj.get("questions");
			    				var classKey = obj.get("classKey");
								var creator = obj.get("creator");
			    				games.push({
			    					users: users,
			    					subject: subject, 
			    					id: id, 
			    					questions : questions, 
			    					object: obj, 
			    					classKey: classKey, 
									creator : creator
			    				})
			    			}
			    		})
			    	})
			    	return games;
			    }
		 } 
	})

    .service('GameService', ['$q', 'ParseConfiguration', '$rootScope', 'socket', 
        function ($q, ParseConfiguration, $rootScope, socket) {
			var selections = new Array();
        	var Game = Parse.Object.extend("Game");
			var game = new Game();

        	return {
        		createGame: function($scope, subject, count){
        			var questions = new Array();
        			game = new Game();
        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
				   
			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("Subject", subject);
			        query.limit(count);

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("Answers");
			                        var subject = obj.get("Subject");
			                        var answer = obj.get("Answer");
			                        questions.push({
			                            title:title,
			                            choices:choices,
			                            subject:subject,
			                            answer: answer
			                        });
			                    }
			                    game.set("questions", questions);
			                    game.set("subject", questions[0].subject);
				        		game.save(null,{});
				        		$scope.finished = true;
			                })
			        });
			        return {questions: questions, game: game, gameId: game.get("objectId")};
			    },

			    createGameWithSetName: function($scope, setName){
        			var questions = new Array();
        			game = new Game();
        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
				   
			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("setName", setName);

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("Answers");
			                        var subject = obj.get("Subject");
			                        var answer = obj.get("Answer");
			                        var setName = obj.get("setName");
			                        questions.push({
			                            title:title,
			                            choices:choices,
			                            subject:subject,
			                            answer: answer,
			                            setName: setName
			                        });
			                    }
			                    game.set("questions", questions);
			                    game.set("subject", questions[0].subject);
				        		game.save(null,{});
				        		$scope.finished = true;
			                })
			        });
			        return {questions: questions, game: game, gameId: game.get("objectId")};
			    },

			    createSecretGame: function($scope, subject, count, classKey){
			    	var questions = new Array();
        			game = new Game();
        			var subject = subject;
        			var classKey = classKey;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
				    game.set("creator", Parse.User.current());
				    game.set("classKey", classKey);
        			
			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("Subject", subject);
			        query.limit(count);

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("Answers");
			                        var subject = obj.get("Subject");
			                        var answer = obj.get("Answer");
			                        questions.push({
			                            title:title,
			                            choices:choices,
			                            subject:subject,
			                            answer: answer
			                        });
			                    }
			                    game.set("questions", questions);
			                    game.set("subject", questions[0].subject);
				        		game.save(null,{});
				        		$scope.finished = true;
			                });
			        });
			        return {questions: questions, game: game, gameId: game.get("objectId")};
			    },

			    updateSet: function(setName, user, score){
			    	var SetHistory = Parse.Object.extend("SetHistory");
			    	var sh = new SetHistory();
			    	sh.set("name", setName);

			    	var setQuery = new Parse.Query(SetHistory);
			    	setQuery.equalTo("name", setName);
			    	setQuery.find().then(function(results){
			    		if(results){
			    			console.log(results);
			    			sh = results[0];
			    		}
			    	})

			    	sh.add("users", {email: user, score: score});
			    	sh.save(null, {
			    		success: function(set){
			    			console.log(set);
			    		}
			    	});
			    	
			    },

			    findSets: function(classKey){
			    	//find class
			    	var Class = Parse.Object.extend("Class");
			    	var classQuery = new Parse.Query(Class);
			    	classQuery.equalTo("classKey", classKey);
			    	classQuery.limit(1);
			    	var setNames = [];

			    	//get setNames for the class
			    	classQuery.find().then(function(result) {
			        	console.log(result); 
			        		var obj = result[0];
			        		setNames = obj.get("setNames");
			        		for(n in setNames){
			        			setNames.push(n);
			        			console.log(n);
			        		}
			        });

			        console.log(setNames);

			    	//query sets using setNames
			    	var matchedSets = [];
			    	if(setNames != []){
			    		for(var i=0; i<setNames.length; i++){
				    		var Question = Parse.Object.extend("Question");
				        	var query = new Parse.Query(Question);
				        	query.equalTo("setName", setNames[i]);
				        	console.log(setNames[i]);
				        	query.find().then(function(results) {
					        	console.log(results); 
					        	if(results != []){
					        		matchedSets.push(setName);
					        	}  
				        	});
			    		}
			    	}
			        return matchedSets;
			    },

			    checkAnswer : function(questions, questionIndex, answerIndex, user, $scope){
			   		var question = questions[questionIndex];

			   		if(question.answer == question.choices[answerIndex]){
			   			//add 1000 points to score and save
			   			user.increment("score", 1000);
			   			$scope.score = user.get("score");
			   			user.save();
			   		
			   			//store the user's selection for feedback later
			   			question.selection = question.choices[answerIndex];
			   			question.wasCorrect = true;
			   			return true;
			   		}else{
			   			question.selection = question.choices[answerIndex];
			   			question.wasCorrect = false;
			   			return false;
			   		}
			   	},

			   	enterGame : function(gameToEnter, $scope){
			   		var defer = $q.defer();
			   		var user = Parse.User.current();

			   		//set user's score as 0 
			   		user.set("score", 0);
				    user.save();

				    //add users to array
			   		var users = gameToEnter.users;
			   		users.push(user.get("username"));
			   		questions = gameToEnter.questions;
			   		game = gameToEnter.object;

			   		//if there is no classKey, then it is a 2 player game and must follow gameLock rules
			   		if(gameToEnter.classKey == null){
			   			if(game.get("gameLock") ==1){
				   			//set questions and game
				   			game.set("users", users);
				   			game.increment("gameLock");
				   			game.set("player2", Parse.User.current());
		                	game.set("gameStatus", "in_progress");
				   		}else{
					        $scope.gameLockOccurred();
				   		}
			   		}else{
			   			//if there is a classKey then only set game's user array, nothing else
			   			game.set("users", users);
			   		}
			   		var creator = gameToEnter.creator;
			   		var creatorEmail = creator.get("username");
			   		var userEmail = user.get("username");


			   		game.save(null, {
						   			success: function(object){
						   				defer.resolve('user successfully entered game');
						   				socket.emit('joinGame', {email:creatorEmail, game:game, user:userEmail});
						   			},
								  	error:function(err) { 
									  	console.log("error in user entering game");
									  	defer.reject('error in entering game');
								   	}	
						   		});
			   		return defer.promise;
			   	},

			   	saveQuestions : function(questions){
			   		var user = Parse.User.current();
			   		var defer = $q.defer();
			   		user.set("savedQuestions", questions);
			   		user.set("score", 0);
           
           			user.save(null,{});
		            
			   	},

			   	endGame : function(g){
				    g.destroy({});
			   	},

			   	startStudying : function($scope, subject, count){
			        var deferred = $q.defer();

        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("Subject", subject);
			        query.limit(count);

			        var questions = new Array();

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("Answers");
			                        var subject = obj.get("Subject");
			                        var answer = obj.get("Answer");
			                        questions.push({
			                            title:title,
			                            choices:choices,
			                            subject:subject,
			                            answer: answer
			                        });
			                    }
			                })
			        	deferred.resolve(questions);

			        });
			        return deferred.promise;

			   	},

			   	convertParseGames : function($scope, rawGames){
			   		var games = new Array();
	                	for(i in rawGames) {
	                                var obj = rawGames[i];
	                                var users = obj.get("users");
	                                var subject = obj.get("subject");
	                                var id = obj.get("objectId");
	                                var questions = obj.get("questions");
	                                var classKey = obj.get("classKey");
	                                var creator = obj.get("creator");
	                                games.push({
	                                    users: users,
	                                    subject: subject, 
	                                    id: id, 
	                                    questions : questions, 
	                                    object: obj, 
	                                    classKey: classKey, 
	                                    creator : creator
	                                })
	                            }
            		
					return games;
			   	},

			   	checkClassKey : function (classKey){

			   		var defer = $q.defer();
			   		if(game.classKey == classKey){
			   			defer.resolve("correct class key");
			   		}else{
			   			defer.reject("incorrect class key");
			   		}

			   		return defer.promise;
			   	},

			   	getQuestions : function(){
			   		return questions;
			   	},


			   	getScore : function(user){
			   		return user.get("score");
			   	},

			   	getUsers : function(){
			   		if(game){
			   			return game.users;
			   		}else{
			   			console.log("No game being played");
			   		}
			    	
			   	}

			}
    }]);
