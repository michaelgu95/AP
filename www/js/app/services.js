angular.module('app.services', [])

	.service('GameRoomService', function(){
		var games = new Array();
		 return {
		 	getGames : function($scope) {
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

    .service('GameService', ['$q', 'ParseConfiguration', '$rootScope',
        function ($q, ParseConfiguration, $rootScope) {
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
				    game.set("creator", Parse.User.current());
				    game.set("player1", Parse.User.current());
				    game.set("gameStatus", "waiting");
				    game.set("gameLock", 1);
				    game.set("turn", "player2");

        			
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
			                })
			        });
			        return {questions: questions, game: game};
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
			                });
			        });
			        return {questions: questions, game: game};
			    },

			    findMatch : function($scope, subject, user){
			    	user.set("status", "finding");
			    	user.set("searchingFor", subject);
			    	user.save();

			    	var query = new Parse.Query(Parse.User);
			    	query.equalTo("searchingFor", subject);

			    	var currentUserId = user.get("objectId");
			    	// query.notEqualTo("objectId", currentUserId);

			    	 var opponent;
			    	query.find().then(function(results){
			    		if(results.length > 0){
			    			opponent = results[0];
			    			
			    		}
					});

					opponent.set("status", "playing");
			    	opponent.save();

					 // broadcast that a user has joined via Parse Cloud
					// var userId = user.get("objectId");
			  //  		Parse.Cloud.run('findOpponent', 
			  //  			{subject:subject, userId: userId},
					// 	{
					// 		success : function(status){
			  //  					console.log(status);
				 //   			}, 
				 //   			error : function(error){
				 //   				console.log(error);
				 //   			}
			  //  			}
			  //  		)

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

			   		//set user's score as 0 
			   		Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    //add users to array
			   		var users = gameToEnter.users;
			   		users.push(Parse.User.current().get("username"));
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

			   		game.save(null, {
						   			success: function(object){
						   				defer.resolve('user successfully entered game');
						   				
						   			},
								  	error:function(err) { 
									  	console.log("error in user entering game");
									  	defer.reject('error in entering game');
								   	}	
						   		});
			   		
			   		


	           
			  

			   		return defer.promise;
			   	},

			   	endGame : function(game){
			   		Parse.User.current().set("score", 0);
				    Parse.User.current().save();
				    var users = game.get("users");

				    game.destroy({});
				
			   	},

			   	startStudying : function($scope, subject, count){
			        // game = new Game();
        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("Subject", subject);
			        query.limit(count);

			        var studyQ = new Array();

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("Answers");
			                        var subject = obj.get("Subject");
			                        var answer = obj.get("Answer");
			                        studyQ.push({
			                            title:title,
			                            choices:choices,
			                            subject:subject,
			                            answer: answer
			                        });
			                    }
			                   
			                })
			        });

			        return studyQ;

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
