(function() {
    var Applications;
    var NavigationModel;

	angular.module('parasite.app')
	.config(function(ApplicationsProvider) {

		var parasiteAppClass = ApplicationsProvider.Application.extend({
			getNavigationModel : function(update) {
				return new NavigationModel.NavigationNode("parasite",
                    null,
                    Applications.applications().map(function(app) {
                        return new NavigationModel.NavigationNode(app.name, app);
                    }));
			},

			isNavigationLinkedToUrl : function() {
				return false;
			}
		});

		var app = new parasiteAppClass("parasite",
            [
                {
                    pluginId    : "parasite.thumbnails",
                    repr        : "parasite"
                }
            ],
            [
                {
                    pluginId    : "parasite.showcase",
                    repr        : "parasite"
                },
                {
                    pluginId    : "parasite.welcome",
                    repr        : "welcome"
                }
            ]);

		ApplicationsProvider.register(app);
	})
	.run(['Applications', 'NavigationModel', function(A, N) {
		Applications = A;
        NavigationModel = N;
	}]);
}());