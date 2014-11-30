angular.module('utils')
.provider('UtilsPlugins', function(PluginsProvider) {
	this.LimitedKidsPlugin = PluginsProvider.NavigationPlugin.extend({
        kidsLimit   : 1000,
		canHandle	: function(node) {
			while (node) {
				if (node.numOfKids > this.kidsLimit) {
					return false;
				}
				node = node.parent;
			}
			return true;
		}
	});

	this.$get = function() {
		return null;
	}
});