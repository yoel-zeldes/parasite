angular.module('general.plugins')
.config(function(PluginsProvider, UtilsPluginsProvider) {
    PluginsProvider.NavigationPlugin.register(
        new (UtilsPluginsProvider.LimitedKidsPlugin.extend({
            id          : "general.tree",
            templateUrl : "/www/applications/general/plugins/tree/plugin.html"
        }))
    );
});
