angular.module('skeleton.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.ContentPlugin.register({
        id          : "skeleton.content",
        templateUrl : "/www/applications/skeleton/plugins/content/plugin.html",
        canHandle	: function(item) {
            return true;
        }
    });
});
