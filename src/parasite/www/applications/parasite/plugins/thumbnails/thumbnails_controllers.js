angular.module("parasite.plugins")
.controller("ThumbnailsCtrl", function($scope, Applications, Navigation) {
    $scope.appDescriptions = {
        'devcenter'  : {
            imgSrc  : "/www/applications/parasite/plugins/thumbnails/res/devcenter-logo.png",
            caption : "Become a true parasite developer."
        },
        'skeleton'  : {
            imgSrc  : "/www/applications/parasite/plugins/thumbnails/res/skeleton-logo.png",
            caption : "An empty application."
        }
    };

    $scope.apps = [];

    $scope.showApp = function(app) {
        var node = Navigation.currentNavigationModel().kids.filter(function(n) {
            return n.item === app;
        })[0];
        Navigation.currentNavigationNode(node);
    };

    $scope.currentApplication = Applications.currentApplication;

    $scope.$watch(function() {
        return Navigation.currentNavigationModel();
    },
    function(model) {
        if (model == null) {
            $scope.apps = [];
        }
        else {
            $scope.apps = model.kids
                .map(function(n) {
                    return n.item;
                })
                .filter(function(app) {
                    return app !== Applications.currentApplication();
                });
        }
    });
});