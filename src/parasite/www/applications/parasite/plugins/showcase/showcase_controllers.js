angular.module("parasite.plugins")
.controller("ShowcaseCtrl", function($scope, Applications, Navigation) {
    var appDescriptions = {
        'devcenter'  : {
            highlight   : "Become a true parasite developer.",
            screenshots : [
                {
                    imgSrc  : "/www/applications/parasite/plugins/showcase/res/devcenter.png",
                    caption : "Read all there is to know to develop your own application."
                }
            ]
        },
        'skeleton'  : {
            highlight   : "An empty application.",
            screenshots : []
        }
    };

    $scope.app = null;
    $scope.currentApplication = Applications.currentApplication;
    $scope.appDescription = null;

    $scope.prev = function() {
        // It's a bad habit to use DOM manipulation in the controller,
        // but using the regular bootstrap "data-slide" attribute conflicts
        // with angular-ui (as we don't have a parent carousel tag), and
        // I'm tired:
        $("#appCarousel").carousel('prev');
    };
    $scope.next = function() {
        $("#appCarousel").carousel('next');
    };

    $scope.$watch(function() {
        return Navigation.currentNavigationNode();
    },
    function(n) {
        $scope.app = n == null ? null : n.item;
        $scope.appDescription = {};
        if ($scope.app != null) {
            // For some reason, if we don't use async, the carousel will flicker:
            $scope.$evalAsync(function() {
                $scope.appDescription = appDescriptions[$scope.app.name] || {
                    highlight   : "Welcome to the " + $scope.app.name + " app!",
                    screenshots : []
                };
            });
        }
    });
});