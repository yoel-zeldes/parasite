angular.module('general.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.NavigationPlugin.register({
        id          : "general.table",
        templateUrl : "/www/applications/general/plugins/table/plugin.html"
    });
});
