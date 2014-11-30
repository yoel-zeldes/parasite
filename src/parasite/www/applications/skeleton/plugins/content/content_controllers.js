angular.module("skeleton.plugins")
.controller("SkeletonContentCtrl", ['$scope', '$interval', 'Navigation', 'Plugins', utils.BaseContentCtrl.extend({
	init			: function($scope, $interval, Navigation, Plugins) {
        this._super($scope, $interval, Navigation, Plugins);
	},

	refreshModel	: function() {
        this.$scope.refreshCounter = (this.$scope.refreshCounter || 0) + 1;
    }
})]);