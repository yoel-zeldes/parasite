angular.module('parasite.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.NavigationPlugin.register({
        id          : "parasite.thumbnails",
        templateUrl : "/www/applications/parasite/plugins/thumbnails/plugin.html"
    });
});
