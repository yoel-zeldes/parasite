angular.module('parasite.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.ContentPlugin.register({
        id          : "parasite.welcome",
        templateUrl : "/www/applications/parasite/plugins/welcome/plugin.html",

        canHandle	: function(item) {
            return item == null;
        }
    });
});