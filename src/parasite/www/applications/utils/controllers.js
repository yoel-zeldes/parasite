(function(ns) {
	ns.BaseContentCtrl = Class.extend({
		init	: function($scope, $interval, Navigation, Plugins) {
			var self = this;
			self.$scope = $scope;
			$scope.item = {};
            self._pluginConf = Plugins.currentContentPluginConf();
			
			var refreshInterval = $interval(_refresh, 60 * 1000);
			$scope.$on('$destroy', function() {
				$interval.cancel(refreshInterval);
			});
			
			$scope.$watch(function() {
				return Navigation.currentNavigationNode();
			},
			function(navigationNode) {
				if (navigationNode == undefined) {
					return;
				}
				
				$scope.item = navigationNode.item || {};
				_refresh();
			});
			
			function _refresh() {
                if (Navigation.currentNavigationNode() != null &&
                    self._pluginConf.canHandle(Navigation.currentNavigationNode().item)) {
                    self.refreshModel();
				}
			}
		},
		
		refreshModel	: function() {
			// This function is called when the currentNavigationNode
			// changes, and in a predefined interval.
			// One should override this function to update $scope.item's data.
            // This function should return nothing.
		}
	});
	ns.BaseContentCtrl.$inject = ['$scope', '$interval', 'Navigation', 'Plugins'];
	
	
	ns.BaseNavigationCtrl = Class.extend({
		init        : function($scope, Navigation, Plugins) {
			this.$scope = $scope;
            this.Navigation = Navigation;
            this.Plugins = Plugins;
		},

        navigateTo  : function(node, canHandleCallback, cantHandleCallback) {
            this.Navigation.currentNavigationNode(node);
            if (canHandleCallback || cantHandleCallback) {
                if (this.Plugins.currentNavigationPluginConf().canHandle(node)) {
                    if (canHandleCallback != undefined) {
                        canHandleCallback();
                    }
                }
                else if (cantHandleCallback != undefined) {
                    cantHandleCallback();
                }
            }
        }
	});
	ns.BaseNavigationCtrl.$inject = ['$scope', 'Navigation', 'Plugins'];
}(window.utils = (window.utils || {})));