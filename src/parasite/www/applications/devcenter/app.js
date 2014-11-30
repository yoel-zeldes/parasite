(function() {
    var $q;
    var $resource;
    var Applications;
    var NavigationModel;

    angular.module('devcenter.app')
        .config(function(dev, ApplicationsProvider) {

            if (!dev) {
                return;
            }

            var navigationModelPromise = undefined;

            var devcenterAppClass = ApplicationsProvider.Application.extend({
                getNavigationModel : function(update) {
                    if (navigationModelPromise != undefined && !update) {
                        return navigationModelPromise;
                    }

                    navigationModelPromise = $q.defer();

                    var devcenterResource = $resource('', {}, {
                        getSlides: {method : 'GET', url : '/devcenter/slides.json'}
                    });

                    devcenterResource.getSlides(function(slides) {
                        function createModel(root) {
                            return new NavigationModel.NavigationNode(root.title, root.item, root.kids.map(function(kid) {
                                return createModel(kid);
                            }));
                        }

                        navigationModelPromise.resolve(createModel(slides));
                    });

                    return navigationModelPromise.promise;
                },

                isNavigationLinkedToUrl : function() {
                    return true;
                }
            });

            var app = new devcenterAppClass("devcenter",
                [
                    {
                        pluginId    : "general.tree",
                        repr        : "devcenter"
                    }
                ],
                [
                    {
                        pluginId    : "devcenter.slide",
                        repr        : "devcenter"
                    }
                ]);

            ApplicationsProvider.register(app);
        })
        .run(['$q', '$resource', 'Applications', 'NavigationModel', function(q, r, A, N) {
            $q = q;
            $resource = r;
            Applications = A;
            NavigationModel = N;
        }]);
}());