angular.module('general.plugins')
.config(function(PluginsProvider, UtilsPluginsProvider) {
    PluginsProvider.NavigationPlugin.register(
        new (UtilsPluginsProvider.LimitedKidsPlugin.extend({
            id          : "general.circles",
            templateUrl : "/www/applications/general/plugins/circles/plugin.html"
        }))
    );
});