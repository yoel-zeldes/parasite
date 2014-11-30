angular.module('devcenter.plugins')
.config(function(PluginsProvider) {
    PluginsProvider.ContentPlugin.register({
        id          : "devcenter.slide",
        templateUrl : "/www/applications/devcenter/plugins/slide/plugin.html",
        canHandle   : function(item) {
            return true;
        }
    });
});
