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
			game = new Game();
        	var users = [];

        	return {
        		createGame: function($scope){

        			

				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
        			
			        var Question = Parse.Object.extend("Question");
			        var query = new Parse.Query(Question);
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
			   		
					var gameFromQuery = new Game();
			   		query.find().then(function(result){
			   				gameFromQuery = result;
			   				defer.resolve('user successfully entered game');
			   		});

			   		users.push(user);
			   		gameFromQuery.set("users", users);
			   		gameFromQuery.save(null, {
			   			success: function(object){
			   				return defer.promise;
			   			}
			   		});
			   		

			   		
			   	}
			}
    }]);
