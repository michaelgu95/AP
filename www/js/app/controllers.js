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
                GameService.createGame($scope);
                $state.go('game');
            }

            $scope.findGame = function(){
                $state.go('gameRoom');
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

    .controller('GameCtrl', function($state, $scope, GameService){
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
    })

    .controller('GameRoomCtrl', function($scope, $state, GameService, GameRoomService, UserService){
        $scope.games = GameRoomService.getGames($scope);
        var user = UserService.currentUser();

        $scope.getGameCreator = function(game){
            return game.users[0];
        }

        $scope.getSubjectImage = function(subject){
            var imagePath = "img/" + subject + ".png";
            return imagePath;
        }

        $scope.enterGame = function(game){
            GameService.enterGame(game, user).then(function(string){
                $state.go('game');
            })
        }
    })

    .controller('AccountCtrl', [
        '$state', '$scope', 'UserService',   // <-- controller dependencies
        function ($state, $scope, UserService) {

            debugger;
            UserService.currentUser().then(function (_user) {
                $scope.user = _user;
            });


        }]);
