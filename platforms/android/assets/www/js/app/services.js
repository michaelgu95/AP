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
			    				games.push({
			    					users: users,
			    					subject: subject, 
			    					id: id, 
			    					questions : questions, 
			    					object: obj
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
        	var questions = new Array();
        	var Game = Parse.Object.extend("Game");
			var game = new Game();
			var otherUsersJoined = false;

        	return {
        		createGame: function($scope, subject){

        			var subject = subject;
				    Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    var users = [Parse.User.current().get("username")];
				    game.set("users", users);
				    game.set("creator", Parse.User.current());
        			
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

			   	getUsers : function(){
			   		if(game){
			   			return game.users;
			   		}else{
			   			console.log("No game being played");
			   		}
			    	
			   	},

			   	otherUsersJoined: function(){
			   		return otherUsersJoined;
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

			   	enterGame: function(gameToEnter){
			   		var defer = $q.defer();

			   		//set user's score as 0 
			   		Parse.User.current().set("score", 0);
				    Parse.User.current().save();

				    //add users to array
			   		var users = gameToEnter.users;
			   		users.push(Parse.User.current().get("username"));

			   		//set questions and game
			   		questions = gameToEnter.questions;
			   		game = gameToEnter.object;
			   		game.set("users", users);
			   		game.save(null, {
						   			success: function(object){
						   				defer.resolve('user successfully entered game');
						   				
						   			},
								  	error:function(err) { 
									  	console.log("Not successfully saved");
									  	defer.resolve('error in entering game');
								   	}	
						   		});
			   		//broadcast that a user has joined
			   		$rootScope.$broadcast('user:joined', Parse.User.current());
			   		return defer.promise;
			   	}
			}
    }]);
