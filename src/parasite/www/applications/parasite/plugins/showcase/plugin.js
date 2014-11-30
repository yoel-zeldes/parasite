angular.module('parasite.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.ContentPlugin.register({
        id          : "parasite.showcase",
        templateUrl : "/www/applications/parasite/plugins/showcase/plugin.html",
        canHandle   : function(item) {
            return item != null;
        }
    });
});
