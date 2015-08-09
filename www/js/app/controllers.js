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
    .controller('HomeCtrl',   
        function ($state, $scope, UserService, GameService) {
            $scope.games = new Array(); 
        //     var rawGames = Parse.User.current().get("currentGames");
        //     var Game = Parse.Object.extend("Game");
        //     var gameQuery = new Parse.Query(Game);
        //     for(var i=0;i<rawGames.length;i++){
        //         var game = rawGames[i];
        //         gameQuery.equalTo("objectId", game);
        //         gameQuery.limit(1);
        //         gameQuery.find().then(function(results){
        //         $scope.$apply(function(){
        //             for(i in results) {
        //                         var obj = results[i];
        //                         var users = obj.get("users");
        //                         var subject = obj.get("subject");
        //                         var id = obj.get("objectId");
        //                         var questions = obj.get("questions");
        //                         var classKey = obj.get("classKey");
        //                         var creator = obj.get("creator").get("username");
        //                         $scope.games.push({
        //                             users: users,
        //                             subject: subject, 
        //                             id: id, 
        //                             questions : questions, 
        //                             object: obj, 
        //                             classKey: classKey, 
        //                             creator : creator
        //                         })
        //                     }
        //         })
        //     })
        // }
            
            
            
            



            $scope.quickPlay = function() {
                $state.go('quickPlay');
            };

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

    .controller('QuickPlayCtrl', function($state, $scope, GameService, $ionicLoading){
        var Game = Parse.Object.extend("Game");
        $scope.game = new Game();
        $scope.findMatch = function(subject){
            var user = Parse.User.current();
            GameService.findMatch($scope, subject, user);
            // .then(function(){

            //     // $state.go('game', {'questions': })
            // });
        }


    })

    .controller('CreateGameCtrl', function($state, $scope, GameService, $ionicLoading){
        $scope.waiting = false;
        $scope.finished = false;
        var classKey = $scope.classKey;

        $scope.startGame = function(subject, count, classKey){
            $scope.waiting = true;
            var questions = new Array();
            var game;
            if(classKey){
               var gs = GameService.createSecretGame($scope, subject, count, classKey);
               questions = gs.questions;
               game = gs.game;
               Parse.User.current().addUnique("currentGames", gs.gameId);
               Parse.User.current().save();
            }else{
               var gs = GameService.createGame($scope, subject, count);
               questions = gs.questions;
               game = gs.game;
               Parse.User.current().addUnique("currentGames", gs.gameId);
               Parse.User.current().save();
            }
            
            // $scope.finished = true;
            // $state.go('tab.list');
            //pass questions and game to game state
            // $state.go('tab.list', {'questions': questions, 'game': game});  
        }

        $scope.stopWaiting = function(){
            $scope.waiting = false;
        }
    })


    .controller('GameCtrl', function($state, $scope, GameService, $ionicNavBarDelegate, $stateParams, $ionicPopup){
        $ionicNavBarDelegate.showBackButton(false);
        $scope.questions = $stateParams.questions;
        $scope.score = 0;
        $scope.currentQuestionIndex = 0;
        $scope.madeSelection = false;
        var studying = $stateParams.studying;
        var correctQuestions = new Array();
        var wrongQuestions = new Array();
        var gameBeingPlayed = $stateParams.game;
        var selectedIndex;


        var answers = [];
        var choices = [];
        for(i in $scope.questions){
            answers.push($scope.questions[i].answer);
            choices.push($scope.questions[i].choices);
        }

        $scope.choiceSelected = function(index){
           selectedIndex = index;
           $scope.madeSelection = true;
        }

        $scope.enter = function(){
            var isCorrect = GameService.checkAnswer($scope.questions, $scope.currentQuestionIndex, selectedIndex, Parse.User.current(), $scope);
            if(isCorrect){
                
                //add to correct questions
                correctQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.currentQuestionIndex++;
                $scope.madeSelection = false;
            }else {
                
                //add to wrong qeustions
                wrongQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.currentQuestionIndex++;
                $scope.madeSelection = false;
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

        $scope.isSelectedIndex = function(index){
            return index == selectedIndex;
        }

        $scope.endGame = function(){
            if(studying){
                $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions});
                GameService.endGame(gameBeingPlayed);
            }else{
                $ionicPopup.show({
                    title: 'Are You Sure?',
                    subTitle: 'Your Opponent Will Receive the Win', 
                    buttons: [
                        { text: 'Cancel', type: 'button-stable' },
                        { text: 'OK', 
                          type: 'button-positive',
                          onTap: function(e){
                            $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions});
                            GameService.endGame(gameBeingPlayed);
                          } 
                        }
                    ]
                })
            }
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

        $scope.findGames = function(){
            $scope.games = GameRoomService.getGames($scope);
            $scope.$broadcast('scroll.refreshComplete');
            $scope.$apply();
        }

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
                        template: '<style>.p{ color:black }</style><input type="password" ng-model="classKey">',
                        title: '<p>Enter Class Key</p>',
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
                                    $state.go('game', {'questions':game.questions, 'game':game.object, 'studying':false});
                                })
                              })
                            }
                          }
                        ]
                      });

             }else{
                GameService.enterGame(game, $scope).then(function(string){
                    console.log(string);
                    $state.go('game', {'questions':game.questions, 'game':game.object, 'studying':false});
                })
             }
        }

        $scope.gameLockOccurred = function(){
            $ionicPopup.show({
                title: 'Game Already In Progress',
                subTitle: 'Another User has already joined this Game', 
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
            $state.go('game', {'questions':studyQ, 'studying': true});
        }
    })

    .controller('AccountCtrl', [
        '$state', '$scope', 'UserService',   // <-- controller dependencies
        function ($state, $scope, UserService) {


            $scope.questions = Parse.User.current().get("savedQuestions");

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
