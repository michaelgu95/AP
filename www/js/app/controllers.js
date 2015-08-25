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
        function ($state, $scope, UserService, GameService, socket) {
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
        $scope.messages = new Array();
        socket.on("userJoined", function(data) {
            var message = data.msg + " with username: " + data.user;
            alert(message);
            $scope.messages.push(message);
        })

            $scope.quickPlay = function() {
                $state.go('quickPlay', {}, {reload: true});
            };

            $scope.createGame = function(){
                $state.go('createGame', {}, {reload: true});
               
            }

            $scope.findGame = function(){
                $state.go('gameRoom', {}, {reload: true});
            }

            $scope.study = function(){
                $state.go('studyMode', {}, {reload: true});
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

    .controller('QuickPlayCtrl', function($state, $scope, GameService, $ionicPopup, $interval, socket){
        var user = Parse.User.current();
        var email = user.get("username");
        $scope.waiting = false;
        $scope.finished = false;

        $scope.findMatch = function(subject){
            $scope.waiting = true;
            $interval(function(){
                if(!$scope.finished){
                    $scope.waiting = false;
                }
            }, 10000);

            socket.emit('findOpponent', {user:user, email:email, subject:subject});
        }

        $scope.leaveQuick = function(){
            socket.emit('leaveRoom', {email: email});
        }
        
        socket.once('opponentFound', function(data){
                $scope.finished = true;
                var gs = GameService.createGame($scope, data.subject, 5);
                $ionicPopup.show({
                    title: data.msg,
                    subTitle: 'Username: ' + data.opponentEmail, 
                    buttons: [
                        { text: 'Start Game', 
                          type: 'button-positive',
                          onTap: function(e){
                            $state.go('game', {'questions': gs.questions, 'game':gs.game, 'opponent':data.opponent, 'opponentEmail':data.opponentEmail, 'mode':"quickPlay"});
                          } 
                        }
                    ]
                })
        });
    })

    .controller('CreateGameCtrl', function($state, $scope, GameService, $ionicLoading, socket){
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
            var username = Parse.User.current().get("username");
            socket.emit('join', {email: username});
            
            // $scope.finished = true;
            // $state.go('tab.list');
            //pass questions and game to game state
            // $state.go('tab.list', {'questions': questions, 'game': game});  
        }

        $scope.stopWaiting = function(){
            $scope.waiting = false;
        }
    })


    .controller('GameCtrl', function($state, $scope, $rootScope, GameService, $ionicNavBarDelegate, $stateParams, $ionicPopup, $ionicScrollDelegate, $interval, socket){
        $ionicNavBarDelegate.showBackButton(false);
        $scope.questions = $stateParams.questions;
        $scope.score = 0;
        $scope.currentQuestionIndex = 0;
        $scope.madeSelection = false;
        $scope.waitingForOpponent = false;
        var correctQuestions = new Array();
        var wrongQuestions = new Array();
        var unansweredQuestions = new Array();
        var gameBeingPlayed = $stateParams.game;
        var selectedIndex;
        console.log($stateParams.opponent);
        // console.log($stateParams.opponent.get("score"));

        var answers = [];
        var choices = [];
        for(i in $scope.questions){
            answers.push($scope.questions[i].answer);
            choices.push($scope.questions[i].choices);
        }

        $scope.choiceSelected = function(index){
           selectedIndex = index;
           $scope.madeSelection = true;
           // $ionicScrollDelegate.$getByHandle('small').scrollBottom();
        }

        $scope.enter = function(){
            var isCorrect = GameService.checkAnswer($scope.questions, $scope.currentQuestionIndex, selectedIndex, Parse.User.current(), $scope);
            // $ionicScrollDelegate.$getByHandle('small').scrollTop();
            $scope.resetTimer();
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
                $scope.checkIfLastQuestion();
            }   
        }

        $scope.checkIfLastQuestion = function(){
            
                if($stateParams.mode == "quickPlay"){
                    // $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'opponent':$stateParams.opponent});
                    socket.emit('finishedGame', {userEmail: Parse.User.current().get("username"), user: Parse.User.current(), score: $scope.score, correctQuestions: correctQuestions, wrongQuestions:wrongQuestions, opponentEmail:$stateParams.opponentEmail, opponent:$stateParams.opponent});
                    socket.on('opponentStatus', function(data){
                        if(data.msg == 'Finished'){
                            $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions, 'opponentData':data.opponentData});

                        }else if(data.msg == 'Waiting'){
                            $scope.waitingForOpponent = true;
                            $interval.cancel(timer);
                            socket.once('opponentFinished', function(data){
                                $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions,'opponentData':data});
                            });
                        }
                    })
        
                }else if($stateParams.mode == "studying"){
                    console.log(unansweredQuestions);
                    $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions});
                }
                
                GameService.endGame(gameBeingPlayed);
            
        }

        $scope.getSubjectImage = function(subject){
            var imagePath = "img/" + subject + ".png";
            return imagePath;
        }

        $scope.isSelectedIndex = function(index){
            return index == selectedIndex && $scope.madeSelection;
        }

        $scope.endGame = function(){
            if($stateParams.mode == "studying"){
                $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions});
                GameService.endGame(gameBeingPlayed);
            }else{
                $ionicPopup.show({
                    title: 'Are You Sure?',
                    subTitle: 'You Will Forfeit the Game', 
                    buttons: [
                        { text: 'Cancel', type: 'button-stable' },
                        { text: 'OK', 
                          type: 'button-positive',
                          onTap: function(e){
                            socket.emit('quitMatch', {userEmail: Parse.User.current().get("username"), opponentEmail:$stateParams.opponentEmail});
                            $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions,'opponent':$stateParams.opponent});
                            GameService.endGame(gameBeingPlayed);
                          } 
                        }
                    ]
                })
            }
        }

        socket.once('opponentQuit', function(data){
            $ionicPopup.show({
                    title: data.msg,
                    subTitle: 'You Will Receive the Win', 
                    buttons: [
                        { text: 'OK', 
                          type: 'button-positive',
                          onTap: function(e){
                            $state.go('gameEnded', {'correctQuestions': correctQuestions, 'wrongQuestions':wrongQuestions, 'unansweredQuestions':unansweredQuestions});
                          } 
                        }
                    ]
                })
        })

        $scope.counter = 30;
        var timer = $interval(function(){
            if($scope.counter > 0){
                $scope.counter--;
            }else if($scope.currentQuestionIndex == ($scope.questions.length-1)){
                unansweredQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.checkIfLastQuestion();
                $scope.currentQuestionIndex++;
                $scope.madeSelection = false;
            } else {
                unansweredQuestions.push($stateParams.questions[$scope.currentQuestionIndex]);
                $scope.currentQuestionIndex++;
                $scope.madeSelection = false;
                $scope.resetTimer();
            }
        }, 1000);  

        $scope.$on('$destroy', function(event) {
            $interval.cancel(timer);
        });

    
        $scope.resetTimer = function(){
            $scope.counter = 30;
        }

    })

    .controller('GameEndedCtrl', function($scope, $state, $stateParams, GameService, socket){
        $scope.score = Parse.User.current().get("score");
        $scope.wrongQuestions = $stateParams.wrongQuestions;
        $scope.correctQuestions = $stateParams.correctQuestions;
        $scope.unansweredQuestions = $stateParams.unansweredQuestions;
        var savedQuestions = Parse.User.current().get("savedQuestions");
        $scope.showCorrect = false;
        $scope.showWrong = false;
        $scope.showUnanswered = false;

        //set opponent fields
        if($stateParams.opponentData){
            var opponentData = $stateParams.opponentData;
            $scope.opponentScore = opponentData.score;
            $scope.opponentWrongQuestions = opponentData.wrongQuestions;
            $scope.opponentRightQuestions = opponentData.rightQuestions;
        }
        


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

        $scope.toggleUnanswered = function(){
            $scope.showUnanswered = !$scope.showUnanswered;
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
            Parse.User.current().set("score", 0);
            Parse.User.current().save();
            $state.go('tab.list', {}, {reload: true});
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
                                    $state.go('game', {'questions':game.questions, 'game':game.object, 'mode':"create"});
                                })
                              })
                            }
                          }
                        ]
                      });

             }else{
                GameService.enterGame(game, $scope).then(function(string){
                    console.log(string);
                    $state.go('game', {'questions':game.questions, 'game':game.object, 'mode':"create"});
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

    .controller('StudyModeCtrl', function($state, $scope, GameService){
        $scope.waiting = false;
        $scope.startGame = function(subject, count){
            $scope.waiting = true;
            GameService.startStudying($scope, subject, count).then(function(questions){
                 $scope.waiting = false;
                 $state.go('game', {'questions':questions, 'mode':"studying"});
            });
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
