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
            if(classKey){
                GameService.createSecretGame($scope, subject, count, classKey);
            }else{
                GameService.createGame($scope, subject, count);
            }

            

            // $ionicLoading.show({
            //   noBackdrop: true,
            //   template: '<p class="item-icon-left">Finding Opponent<ion-spinner icon="ripple"/></p>'
            // });

            //watch for users to join game
            // $scope.$on('user:joined', function(event,data){
            //     $ionicLoading.hide();
                 
            // })

            $state.go('game');  
        }
    })


    .controller('GameCtrl', function($state, $scope, GameService, $ionicNavBarDelegate){
        $ionicNavBarDelegate.showBackButton(false);

        $scope.questions = GameService.getQuestions();
        $scope.score = 0;
        $scope.currentQuestionIndex = 0;

        var answers = [];
        var choices = [];
        for(i in $scope.questions){
            answers.push($scope.questions[i].answer);
            choices.push($scope.questions[i].choices);
        }

        $scope.choiceSelected = function(index){
            if($scope.currentQuestionIndex == ($scope.questions.length-1)){
                $state.go('gameEnded');
            }

            var isCorrect = GameService.checkAnswer($scope.currentQuestionIndex, index, Parse.User.current(), $scope);
            if(isCorrect){
                $scope.currentQuestionIndex++;
                $scope.$apply();
            }else {
                $scope.currentQuestionIndex++;
                $scope.$apply();
            }  
        }

        $scope.getSubjectImage = function(subject){
            var imagePath = "img/" + subject + ".png";
            return imagePath;
        }

        $scope.endGame = function(){
            GameService.endGame();
        }
    })

    .controller('GameEndedCtrl', function($scope, GameService){
        $scope.score = Parse.User.current().get("score");
        $scope.wrongQuestions = GameService.getWrongQuestions();
        $scope.rightQuestions = GameService.getRightQuestions();
        var savedQuestions = Parse.User.current().get("savedQuestions");


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

        $scope.saveQuestions = function(){
            Parse.User.current().set('savedQuestions', savedQuestions);
            Parse.User.current().save(null, {
                                    success: function(object){
                                        console.log('user successfully entered game');
                                        
                                    },
                                    error:function(err) { 
                                        console.log('error in entering game');
                                    }   
                                });
            GameService.endGame();
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
                                GameService.enterGame(game).then(function(string){
                                    console.log(string);
                                    $state.go('game');
                                })
                              })
                            }
                          }
                        ]
                      });

               
                
             }else{
                GameService.enterGame(game).then(function(string){
                    console.log(string);
                    $state.go('game');
                })
             }
        }
    })

    .controller('StudyModeCtrl', function($state, $scope, GameService, $ionicLoading){


        $scope.startGame = function(subject, count){
            GameService.startStudying($scope, subject, count);
            $state.go('game');  
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
