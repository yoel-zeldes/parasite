(function() {
    var NavigationModel;

    angular.module('skeleton.app')
    .config(function(ApplicationsProvider, dev) {

        if (!dev) {
            return;
        }

        var skeletonAppClass = ApplicationsProvider.Application.extend({
            getNavigationModel : function(update) {
                // The model is composed of a root and nothing more:
                return new NavigationModel.NavigationNode("skeleton", null);
            }
       });

        var app = new skeletonAppClass("skeleton",
            [
                {
                    pluginId    : "skeleton.navigation",
                    repr        : "<i class='icon-reorder icon-large'></i> <big>navigation</big>"
                }
            ],
            [
                {
                    pluginId    : "skeleton.content",
                    repr        : "<i class='icon-reorder icon-large'></i> <big>content</big>"
                }
            ]);

        ApplicationsProvider.register(app);
    })
	.run(['NavigationModel', function(N) {
        NavigationModel = N;
	}]);
}());