angular.module('core.login')
    .service('login', function($q, $modal, Applications, dev) {
        var self = this;
        var user = dev ? 'developer' : undefined;

        this.isLoginSupported = function() {
            /*
            return: true iff the current application supports login
                    (is the user allowed to login).
             */
            return Applications.currentApplication().isLoginSupported();
        };

        this.user = function(userName, msg) {
            /*
            If called with no arguments, return the user name (if the user has
            never login, undefined will be returned).

            If called with userName as true, then return a promise of the
            user name. If the user hasn't login, a prompt will ask the
            user to login (by calling promptLogin), and only when he
            completes the login the promise will be resolved. The msg
            argument will be used as the message the user will see in
            the prompt.

            If called with userName as a string, set the user name accordingly.
             */
            if (userName === true) {
                return $q.when(user || this.promptLogin(msg));
            }

            if (userName == undefined) {
                return user;
            }

            user = userName;
        };

        this.promptLogin = function(msg) {
            /*
            Prompt the user for login.

            param msg: (optional) the message the user will see.

            return: a promise of the user name (which will be
                    available by subsequent calls to user()).
             */
            var modal = $modal.open({
                templateUrl : '/www/core/login.partial.html',
                controller  : function($scope, login) {
                    $scope.newUserName = login.user();
                    $scope.msg = msg;
                }
            });

            return modal.result.then(function(userName) {
                self.user(userName);

                return userName;
            });
        };
    });