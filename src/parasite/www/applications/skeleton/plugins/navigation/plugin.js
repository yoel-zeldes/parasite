angular.module('skeleton.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.NavigationPlugin.register({
        id          : "skeleton.navigation",
        templateUrl : "/www/applications/skeleton/plugins/navigation/plugin.html",
        canHandle	: function(item) {
			return true;
		}
    });
});
