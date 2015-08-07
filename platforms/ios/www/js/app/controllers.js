/**
 * beginnings of a controller to login to system
 * here for the purpose of showing how a service might
 * be used in an application
 */
angular.module('app.controllers', [])
    .controller('ListDetailCtrl', [
        '$state', '$scope', '$stateParams', 'UserService',   // <-- controller dependencies
        function ($state, $scope, $stateParams, UserService) {

            $scope.index = $stateParams.itemId;

        }])
    .controller('HomeCtrl',   // <-- controller dependencies
        function ($state, $scope, UserService, GameService) {

            $scope.questions = new Array();
            $scope.createGame = function(){
                $state.go('createGame');
               
            }

            $scope.findGame = function(){
                $state.go('gameRoom');
            }

            $scope.study = function(){
                $state.go('studyMode');
            }

            $scope.doLogoutAction = function () {
                UserService.logout().then(function () {

                    // transition to next state
                    $state.go('app-login');

                }, function (_error) {
                    alert("error logging in " + _error.debug);
                })
            };
        })

    .controller('CreateGameCtrl', function($state, $scope, GameService, $ionicLoading){

        var classKey = $scope.classKey;

        $scope.startGame = function(subject, count, classKey){
            var questions = new Array();
            var game;
            if(classKey){
               questions = GameService.createSecretGame($scope, subject, count, classKey);
            }else{
               var gs = GameService.createGame($scope, subject, count);
               questions = gs.questions;
               game = gs.game;
            }

            //pass questions and game to game state
            $state.go('game', {'questions': questions, 'game': game});  
        }
    })


    .controller('GameCtrl', function($state, $scope, GameService, $ionicNavBarDelegate, $stateParams){
        $ionicNavBarDelegate.showBackButton(false);
        var gameBeingPlayed = $stateParams.game;
        $scope.questions = $stateParams.questions;
        $scope.score = 0;
        $scope.currentQuestionIndex = 0;
        var correctQuestions = new Array();
        var wrongQuestions = new Array();

        var answers = [];
        var choices = [];
        for(i in $scope.questions){
            answers.push($scope.questions[i].answer);
            choices.push($scope.questions[i].choices);
        }

        $scope.choiceSelected = function(index){
           

            var isCorrect = GameService.checkAnswer($scope.questions, $scope.currentQuestionIndex, index, Parse.User.current(), $scope);
            if(isCorrect){
                
                //add to correct questions
                correctQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.currentQuestionIndex++;
            }else {
                
                //add to wrong qeustions
                wrongQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.currentQuestionIndex++;
            }  

             if($scope.currentQuestionIndex == ($scope.questions.length)){
                $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions});
                GameService.endGame(gameBeingPlayed);
            }
        }

        $scope.getSubjectImage = function(subject){
            var imagePath = "img/" + subject + ".png";
            return imagePath;
        }

    })

    .controller('GameEndedCtrl', function($scope, $stateParams, GameService){
        $scope.score = Parse.User.current().get("score");
        $scope.wrongQuestions = $stateParams.wrongQuestions;
        $scope.correctQuestions = $stateParams.correctQuestions;
        var savedQuestions = Parse.User.current().get("savedQuestions");
        $scope.showCorrect = false;
        $scope.showWrong = false;


        $scope.isNormal = function(question,choice){
            if(question.answer == choice){
               return false;
            }else if (question.selection == choice){
                return false;
            }else{
                return true;
            }
        }

        $scope.isWrong = function(question, choice){
            if(question.answer == choice){
               return false;
            }else if (question.selection == choice){
                return true;
            }else{
                return false;
            }
        }

        $scope.isCorrect = function(question, choice){
            if(question.answer == choice){
               return true;
            }else{
                return false;
            }
        }

        $scope.addQuestion = function(question){
            if(savedQuestions == null){
                savedQuestions = new Array();
            }
            savedQuestions.push(question);
        }

        $scope.toggleCorrect = function(){
            $scope.showCorrect = !$scope.showCorrect;
        }

        $scope.toggleWrong = function(){
            $scope.showWrong = !$scope.showWrong;
        }

        $scope.saveQuestions = function(){
            // Parse.User.current().set("savedQuestions", savedQuestions);
           
            Parse.User.current().save({savedQuestions: savedQuestions}, {
                                    success: function(object){
                                        console.log('successfully saved questions');
                                        
                                    },
                                    error:function(err) { 
                                        console.log(err.message);
                                    }   
                                });
        }
    })

    .controller('GameRoomCtrl', function($scope, $state, GameService, GameRoomService, UserService, $ionicPopup, $timeout){
        $scope.games = GameRoomService.getGames($scope);

        var user = UserService.currentUser();

        $scope.getGameCreator = function(game){
            return game.users[0];
        }

        $scope.getQuestionCount = function(game){
            return game.questions.length;
        }

        $scope.getSubjectImage = function(subject){
            var imagePath = "img/" + subject + ".png";
            return imagePath;
        }

        $scope.enterGame = function(game){
            if(game.classKey != null){

                    var myPopup = $ionicPopup.show({
                        template: '<input type="password" ng-model="classKey">',
                        title: 'Enter Class Key',
                        subTitle: 'See Your Instructor',
                        scope: $scope,
                        buttons: [
                          { text: 'Cancel' },
                          {
                            text: '<b>Next</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                              GameService.checkClassKey($scope.classKey).then(function(res){
                                GameService.enterGame(game, $scope).then(function(string){
                                    console.log(string);
                                    $state.go('game', {'questions':game.questions, 'game':game.object});
                                })
                              })
                            }
                          }
                        ]
                      });

             }else{
                GameService.enterGame(game, $scope).then(function(string){
                    console.log(string);
                    $state.go('game', {'questions':game.questions, 'game':game.object});
                })
             }
        }

        $scope.gameLockOccurred = function(){
             $ionicPopup.show({
                              title: 'Game Already In Progress',
                              content: 'Another User has already joined this Game', 
                              buttons: [
                                { text: 'OK', type: 'button-positive' }]
                            }).then(function(res) {
                              console.log('GameLock!');
                            });
            
        }
    })

    .controller('StudyModeCtrl', function($state, $scope, GameService, $ionicLoading){

        $scope.startGame = function(subject, count){
            
            var studyQ = GameService.startStudying($scope, subject, count);
            $state.go('game', {'questions':studyQ});
        }
    })

    .controller('AccountCtrl', [
        '$state', '$scope', 'UserService',   // <-- controller dependencies
        function ($state, $scope, UserService) {

            debugger;
            UserService.currentUser().then(function (_user) {
                $scope.user = _user;
                $scope.questions = _user.get("savedQuestions");
            });
            $scope.isNormal = function(question,choice){
                if(question.answer == choice){
                   return false;
                }else{
                    return true;
                }
            }

            $scope.isCorrect = function(question, choice){
                if(question.answer == choice){
                   return true;
                }else{
                    return false;
                }
            }

            $scope.getSubjectImage = function(subject){
                var imagePath = "img/" + subject + ".png";
                return imagePath;
            }

        }]);
