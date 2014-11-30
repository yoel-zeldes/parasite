angular.module('parasiteApp')
.config(function($locationProvider) {
	$locationProvider.html5Mode(true);
})


.config(function($httpProvider) {
	$httpProvider.interceptors.push(function() {
		return {
			'request' : function(config) {
                if (config.url.replace) {
				    config.url = config.url.replace(/%2F/g, "/");
                }

				return config;
			}
		};
	});
})


.controller('ApplicationsCtrl', function($scope,
		Applications,
		Plugins,
		Navigation,
        login) {

	$scope.login = login;
	$scope.currentApplication = Applications.currentApplication;
	$scope.navigationPluginConfs = Plugins.navigationPluginConfs;
	$scope.currentNavigationPluginConf = Plugins.currentNavigationPluginConf;
	$scope.currentContentPluginConf = Plugins.currentContentPluginConf;
	$scope.navigationPluginLoading = Plugins.navigationPluginLoading;
	$scope.contentPluginLoading = Plugins.contentPluginLoading;
	$scope.navigationPluginLoadingFailed = Plugins.navigationPluginLoadingFailed;
	$scope.contentPluginLoadingFailed = Plugins.contentPluginLoadingFailed;

    var reversedContentPluginConfs;
    $scope.$watch(function() {
        return Plugins.contentPluginConfs();
    },
    function(pluginConfs) {
        if (pluginConfs == undefined) {
            reversedContentPluginConfs = undefined;
        }
        else {
            // We have to reverse the order, because in the html we use the
            // css class ".pull-right" on the plugins buttons, which makes
            // the buttons order reversed:
            reversedContentPluginConfs = pluginConfs.slice().reverse();
        }
    });
	$scope.contentPluginConfs = function() {
        return reversedContentPluginConfs;
    };

    $scope.navigationPluginTemplate = "";
    $scope.$watch(function() {
        return Plugins.currentNavigationPluginConf();
    },
    function(pluginConf) {
        $scope.navigationPluginTemplate = pluginConf ? pluginConf.plugin.templateUrl + '#' + pluginConf.repr : "";
    });

    $scope.contentPluginTemplate = "";
    $scope.$watch(function() {
        return Plugins.currentContentPluginConf();
    },
    function(pluginConf) {
        $scope.contentPluginTemplate = pluginConf ? pluginConf.plugin.templateUrl + '#' + pluginConf.repr : "";
    });
})


.controller('LoginCtrl', function($scope, login) {
    function getGreeting() {
        var greeting;
        var hours = new Date().getHours();
        if (hours < 9) {
            greeting = ["Good morning ", ". You're up early...."];
        }
        else if (hours < 11) {
            greeting = ["Good morning ", ". Have a great day"];
        }
        else if (hours < 12) {
            greeting = ["You should get ready to Nino, ", ""];
        }
        else if (hours < 14) {
            greeting = ["Hi ", ". Have you had fun with Nino?"];
        }
        else if (hours < 15) {
            greeting = ["Good afternoon ", ""];
        }
        else if (hours < 16) {
            greeting = ["The Shekem is about to close ", ". Hurry up!"];
        }
        else if (hours < 17) {
            greeting = ["Hi ", ". Are you hungry?"];
        }
        else if (hours < 18) {
            greeting = ["Hi ", ". Almost time for Nino again..."];
        }
        else {
            greeting = ["What are you doing here ", "?"];
        }

        return greeting;
    }

    $scope.greetingPrefix = "";
    $scope.greetingSufix = "";

    $scope.$watch(getGreeting,
    function(greeting) {
        $scope.greetingPrefix = greeting[0];
        $scope.greetingSuffix = greeting[1];
    },
    true);
})


.controller('PluginLinkCtrl', function($scope, $sce) {
	$scope.repr = "";

	$scope.$watch(function() {
		return $scope.p.repr;
	},
	function(repr) {
		$scope.repr = $sce.trustAsHtml(repr);
	});
})


.controller('BreadcrumbCtrl', function($scope, Navigation) {
	$scope.breadcrumbs = [];
	$scope.currentNavigationNode = Navigation.currentNavigationNode;

	$scope.$watch(function() {
		return Navigation.currentNavigationNode();
	},
	function(node) {
		$scope.breadcrumbs.splice(0, $scope.breadcrumbs.length);
		while (node) {
			$scope.breadcrumbs.push(node);
			node = node.parent;
		}
		$scope.breadcrumbs.reverse();
	});
});