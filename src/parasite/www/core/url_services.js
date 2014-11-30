angular.module('core.url')
.service('ParasiteURL', function($rootScope, $location, $q, dev, Applications, Plugins, Navigation, Search) {
	var self = this;

	// $location.path() is of the form
	// "http://127.0.0.1:8000/app/<appName>/<resourceId>" in dev mode,
	// and "http://<appName>/<resourceId>" in prod mode.

	this.applicationName = function(name) {
        /*
        If called with no argument, get the the current application's name
        (encoded in the URL).
        If called with a name of an application, encode it in the URL.
         */
		if (name == undefined) {
            if (!dev) {
                return $location.host();
            }

			if ($location.path() == "/") {
				return "";
			}

			return $location.path().split("/")[2];
		}

		if (this.applicationName() != name) {
            if (dev) {
                $location.path("/app/" + name + this.navigationNodeId());
            }
            else {
                window.location.host = name;
            }
		}
	};

	this.navigationNodeId = function(id) {
        /*
        If called with no argument, get the current navigation node's id
        (encoded in the URL).
        If called with a string id of some NavigationNode, encode it in the URL.
         */
		if (id == undefined) {
			var res = "/" + $location.path().split("/").slice(dev ? 3 : 1).join("/");
			if (res[res.length - 1] == "/") {
				res = res.slice(0, res.length - 1);
			}
			return res;
		}

        $location.path(dev ? ("/app/" + this.applicationName() + id) : id);
	};

    this.navigationPluginIndex = function(index) {
        /*
        If called with no argument, get the index of the navigation plugin the
        user is using (encoded in the URL).
        If called with an integer (the index of the navigation plugin the user
        is viewing), encode it in the URL.
         */
        if (index == undefined) {
            return Number($location.search()['navigation']);
        }

        $location.search('navigation', index);
    };

    this.contentPluginIndex = function(index) {
        /*
        The same as navigationPluginIndex but for the content plugin.
         */
        if (index == undefined) {
            return Number($location.search()['content']);
        }

        $location.search('content', index);
    };

    function getQueriesFromUrl() {
        var queries = $location.search()['q'] || [];
        if (!(queries instanceof Array)) {
            queries = [queries]
        }

        return queries;
    }

	this.search = function(queries) {
        /*
        If called with no argument, return the current search query (encoded
        in the URL). A search query is an Array of objects. Each object contains
        the attributes filter, operator and value. To read more about it, refer to
        http://127.0.0.1:8000/app/devcenter/creating%20an%20app/server%20side/search/overview

        If called with an Array (each item can be a query object, or
        JSON.stringify of such an object), encode it to the URL.
         */
		if (queries == undefined) {
            return (getQueriesFromUrl() || []).map(function(q) {
                return JSON.parse(q);
            });
		}

        if (! (queries instanceof Array)) {
            queries = [queries];
        }

        $location.search('q', queries.map(function(q) {
            q = q || {};
            if (q.filter === undefined || q.operator === undefined || q.value === undefined) {
                throw new Error('search queries must be objects containing filter, operator and value fields');
            }
            return JSON.stringify(q);
        }));
	};

    this.sort = function(field, isAscending) {
        /*
        If called with no arguments, return the current sort (encoded in the
        URL). The sort is an object containing sort string field, and
        isAscending boolean field. Together, they imply to the application
        that the navigation model should be sorted according to the sort
        field in an ascending / descending order (decided by isAscending).

        If called with arguments, encode it to the URL.
         */
        if (field == undefined) {
            return {
                sort        : $location.search()['sort'],
                isAscending : {'true' : true, 'false' : false}[$location.search()['isAscending']]
            };
        }
        if (isAscending === undefined) {
            isAscending = field.isAscending;
            field = field.sort;
        }

        $location.search('sort', field);
        $location.search('isAscending', isAscending == null ? isAscending : String(isAscending));
    };


	$rootScope.$watch(function() {
		return self.applicationName();
	},
	function(name) {
        var app;
		Applications.applications().some(function(a) {
			if (name == a.name) {
				app = a;
                return true;
			}
            if (a.name == 'parasite') {
                // In case there's no app with the given name, the fallback is parasite:
                app = a;
            }
		});
        Applications.currentApplication(app);
        // We need to set the applicationName in case name is invalid and we've
        // switched to parasite (notice that the watch won't catch it in case
        // we started in the parasite app, and then switched to an illegal app name):
        self.applicationName(app.name);
	});

	$rootScope.$watch(function() {
		return Applications.currentApplication();
	},
	function(newApplication, oldApplication) {
		self.applicationName(newApplication.name);
		if (newApplication != oldApplication) {
			self.navigationNodeId("");
		}
        else {
            self.search(self.search());
            self.sort(self.sort());
        }
	});

	$rootScope.$watchCollection(function() {
		return [Navigation.currentNavigationModel(), self.navigationNodeId()];
	},
	function(data) {
        var model = data[0];
        var id = data[1];
		if (model == undefined || id == undefined) {
			return;
		}

		if (!Applications.currentApplication().isNavigationLinkedToUrl()) {
			Navigation.currentNavigationNode(Navigation.currentNavigationModel());
		}
		else {
			Navigation.idToNavigationNode(id).then(function(node) {
				if (node) {
					Navigation.currentNavigationNode(node);
				}
				else {
					//TODO: should we inform an error to the user
					// (instead of just referring back to "")?
					Navigation.currentNavigationNode(Navigation.currentNavigationModel());
				}
			});
		}
	},
    true);

	$rootScope.$watch(function() {
		if (!Applications.currentApplication().isNavigationLinkedToUrl()) {
			return undefined;
		}
		return Navigation.currentNavigationNode();
	},
	function(node) {
		if (node != undefined) {
			self.navigationNodeId(Navigation.navigationNodeToId(node));
		}
	});

    $rootScope.$watch(function() {
        return [self.contentPluginIndex(), self.navigationPluginIndex()];
    },
    function(val) {
        var app = Applications.currentApplication();
        Plugins.currentContentPluginConf(app.contentPluginConfs[val[0]]);
        Plugins.currentNavigationPluginConf(app.navigationPluginConfs[val[1]]);
    },
    true);

    $rootScope.$watch(function() {
        return Plugins.currentContentPluginConf();
    },
    function(pluginConf) {
        if (pluginConf != null) {
            self.contentPluginIndex(Applications.currentApplication().contentPluginConfs.indexOf(pluginConf));
        }
    });
    $rootScope.$watch(function() {
        return Plugins.currentNavigationPluginConf();
    },
    function(pluginConf) {
        if (pluginConf != null) {
            self.navigationPluginIndex(Applications.currentApplication().navigationPluginConfs.indexOf(pluginConf));
        }
    });

    $rootScope.$watch(function() {
        return self.search();
    },
    function(search) {
        // The reason this is done here (and not in self.search()) is that the
        // URL may change by other means (e.g. - when the user goes back in the
        // history).
        Search.search(search);
    },
    true);

    $rootScope.$watch(function() {
        return Search.search();
    },
    function(search) {
        self.search(search);
    },
    true);

    $rootScope.$watch(function() {
        return self.sort();
    },
    function(sort) {
        Search.sort(sort);
    },
    true);

    $rootScope.$watch(function() {
        return Search.sort();
    },
    function(sort) {
        // The reason this is done here (and not in self.sort()) is that the
        // URL may change by other means (e.g. - when the user goes back in the
        // history).
        self.sort(sort);
    },
    true);
})

// Make sure ParasiteURL is instantiated:
.run(function(ParasiteURL) {
});