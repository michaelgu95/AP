angular.module('app.services', [])

	.service('GameRoomService', function(){
		var games = new Array();
		 return {
		 	getGames : function($scope) {
			    	var Game = Parse.Object.extend("Game");
			    	var query = new Parse.Query(Game);
			    	query.find().then(function(results){
			    		$scope.$apply(function(){
			    			for(i in results) {
			    				var obj = results[i];
			    				var users = obj.get("users");
			    				var subject = obj.get("subject");
			    				var id = obj.get("objectId");
			    				var questions = obj.get("questions");
			    				games.push({
			    					users: users,
			    					subject: subject, 
			    					id: id, 
			    					questions : questions
			    				})
			    			}
			    		})
			    	})

			    	return games;
			    }
		 }
	})

    .service('GameService', ['$q', 'ParseConfiguration',
        function ($q, ParseConfiguration) {
        	var questions = new Array();
        	var Game = Parse.Object.extend("Game");
			var game = new Game();

        	return {
        		createGame: function($scope, subject){

        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
        			
			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
			        query.equalTo("subject", subject);

			        query.find().then(function(results) {
			                $scope.$apply(function(){
			                    for (i in results) {
			                        var obj = results[i];
			                        var title = obj.get("title");
			                        var choices = obj.get("choices");
			                        var subject = obj.get("subject");
			                        var answer = obj.get("answer");
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
			    },

			   	getQuestions : function(){
			   		return questions;
			   	},


			   	getScore : function(user){
			   		return user.get("score");
			   	},

			   	checkAnswer : function(questionIndex, answerIndex, user, $scope){
			   		var question = questions[questionIndex];

			   		if(question.answer == question.choices[answerIndex]){
			   			user.increment("score", 1000);
			   			$scope.score = user.get("score");
			   			user.save();
			   			return true;
			   		}else{
			   			return false;
			   		}
			   	},

			   	enterGame: function(gameToEnter, user){
			   		Parse.User.current().set("score", 0);
				    Parse.User.current().save();

			   		var defer = $q.defer();
			   		game = gameToEnter;
			   		var users = gameToEnter.users;
			   		questions = gameToEnter.questions;

			   		var Game = Parse.Object.extend("Game");
			   		var query = new Parse.Query(Game);
			   		query.equalTo("objectId", gameToEnter.id);

			   		// query.find().then(function(results){
			   		// 	game = results[0];
			   		// 	questions = results[0].get("questions");
			   		// 	users = results[0].get("users");
			   		// 	users.push(user);
			   		// })
			   		
					
			   		query.find({
			   			success: function(results){

				   			for(i in results){
				   				users.push(user);
				   				var gameFromQuery = results[i];
				   				gameFromQuery.addUnique("users", user);
				   				gameFromQuery.save(null, {
						   			success: function(object){
						   				defer.resolve('user successfully entered game');
						   				
						   			},
								  	error:function(err) { 
									  	console.log("Not successfully saved");
									  	defer.resolve('error in entering game');
								   	}	
						   		});

				   				
			   				}	
			   			}, 
			   			error: function(error){
			   				console.log("Erorr in query of game to enter");
			   			}
			   		});
			   		return defer.promise;
			   	}
			}
    }]);
