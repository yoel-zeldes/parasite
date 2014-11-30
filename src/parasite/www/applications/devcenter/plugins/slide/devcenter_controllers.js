angular.module("devcenter.plugins")
.controller("DevcenterCtrl", ['$scope', '$q', '$interval', 'Navigation', 'Plugins', utils.BaseContentCtrl.extend({
	init			: function($scope, $q, $interval, Navigation, Plugins) {
        this._super($scope, $interval, Navigation, Plugins);

        function dfs(node) {
            return [node].concat(node.kids
                .map(function(kid) {
                    return dfs(kid);
                })
                .reduce(function(a, b) {
                    return a.concat(b)
                }, []));
        }

        var flatSlides;
        $scope.$watch(function() {
            return Navigation.currentNavigationModel();
        },
        function(model) {
            if (model != null) {
                flatSlides = dfs(model);
            }
        });

        $scope.prevSlide = null;
        $scope.nextSlide = null;

        $scope.currentNavigationNode = Navigation.currentNavigationNode;


        $scope.$watch(function() {
            return Navigation.currentNavigationNode();
        },
        function(node) {
            if (node != null) {
                $scope.prevSlide = flatSlides[flatSlides.indexOf(node) - 1];
                $scope.nextSlide = flatSlides[flatSlides.indexOf(node) + 1];
            }
        });
	}
})]);