/**
 * beginnings of a controller to login to system
 * here for the purpose of showing how a service might
 * be used in an application
 */
angular.module('user.controllers', [])
    .controller('LoginController', [
        '$state', '$scope', 'UserService', '$ionicPopup',   // <-- controller dependencies
        function ($state, $scope, UserService, $ionicPopup) {

            debugger;

            // ng-model holding values from view/html
            $scope.creds = {
                username: "adminuser",
                password: "password"
            };

            /**
             *
             */
            $scope.doLogoutAction = function () {
                UserService.logout()
                    .then(function (_response) {
                        // transition to next state
                        $state.go('app-login');
                    }, function (_error) {
                        alert("error logging in " + _error.debug);
                    })
            };

            /**
             *
             */
            $scope.doLoginAction = function () {
                UserService.login($scope.creds.username, $scope.creds.password)
                    .then(function (_response) {

                        $ionicPopup.show({
                            title: "Login Successful!",
                            buttons: [
                                { text: 'OK', 
                                  type: 'button-positive',
                                  onTap: function(e){
                                    $state.go('tab.list');
                                  } 
                                }
                            ]
                        })

                        // transition to next state
                        

                    }, function (_error) {
                        $ionicPopup.show({
                            title: "Error",
                            subTitle: "Incorrect Email or Password",
                            buttons: [
                                { text: 'OK', 
                                  type: 'button-positive',
                                  onTap: function(e){
                                    $state.go('tab.list');
                                  } 
                                }
                            ]
                        })
                    })
            };
        }])
    .controller('SignUpController', [
        '$state', '$scope', 'UserService',   // <-- controller dependencies
        function ($state, $scope, UserService) {

            $scope.creds = {};

            /**
             *
             */
            $scope.signUpUser = function () {

                UserService.init();

                UserService.createUser($scope.creds).then(function (_data) {
                    $scope.user = _data;

                    alert("Success Creating User Account ");

                    $state.go('tab.list', {});

                }, function (_error) {
                    alert("Error Creating User Account " + _error.debug)
                });
            }
        }]);
