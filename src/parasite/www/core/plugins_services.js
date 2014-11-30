angular.module('core.plugins')
.provider('Plugins', function() {
	var self = this;
	var allNavigationPlugins = [];
	var allContentPlugins = [];

    /*
    The base class of all plugins.
    Each plugin instance contains a unique id, templateUrl (the URL of the page
    which contains the plugin's content), and canHandle function (which given
    a NavigationNode's item, return true iff the plugin can render content
    for it).
     */
	var Plugin = Class.extend({
        id          : "id",
        templateUrl : "this is the URL of the page which contains the plugin's content",

        // Return true iff the plugin can handle the given item and display a matching content.
        canHandle	: function(item) {
			return true;
		}
	});

    /*
    The base class for all of the navigation plugins.
    In addition to inheriting everything from the Plugin class,
    this class contains a static register function.
     */
	var NavigationPlugin = Plugin.extend({
	});
    NavigationPlugin.register = function(plugin) {
        /*
        Register the given plugin to the repository of navigation plugins
        available for use by the application objects.

        param plugin: an instance of a class extending NavigationPlugin.
         */
        if (! (plugin instanceof NavigationPlugin)) {
            plugin = new (NavigationPlugin.extend(plugin));
        }
        allNavigationPlugins.push(plugin);
    };
    this.NavigationPlugin = NavigationPlugin;

    /*
    The base class for all of the content plugins.
    In addition to inheriting everything from the Plugin class,
    this class contains a static register function.
     */
	var ContentPlugin = Plugin.extend({
	});
    ContentPlugin.register = function(plugin) {
        /*
        Register the given plugin to the repository of content plugins
        available for use by the application objects.

        param plugin: an instance of a class extending ContentPlugin.
         */
        if (! (plugin instanceof ContentPlugin)) {
            plugin = new (ContentPlugin.extend(plugin));
        }
        allContentPlugins.push(plugin);
    };
    this.ContentPlugin = ContentPlugin;

    var Loading = Class.extend({
        init : function() {
            this.nextToken = 0;
            this.reset();
        },

        reset : function() {
            this.tokensInUse = [];
            this._loadingFailed = false;
        },

        isLoading : function() {
            return this.tokensInUse.length > 0;
        },

        loading : function() {
            var token = this.nextToken++;
            this.tokensInUse.push(token);
            this.loadingFailed(false);

            return token;
        },

        unloading : function(token) {
            var i = this.tokensInUse.indexOf(token);
            if (i < 0) {
                return false;
            }

            this.tokensInUse.splice(i, 1);
            return true;
        },

        loadingFailed : function(failed) {
            if (failed === undefined) {
                return this._loadingFailed;
            }

            if (failed === true) {
                this.tokensInUse = [];
            }

            this._loadingFailed = failed;
        }
    });



	this.$get = function($rootScope, Applications, Navigation) {

		var navigationPluginConfs;
		var contentPluginConfs;
		var currentNavigationPluginConf = null;
		var currentContentPluginConf = null;
        var navigationPluginLoading = new Loading();
        var contentPluginLoading = new Loading();

        function bindPlugin(pluginConf, pluginsRepository) {
            var plugin = pluginsRepository.filter(function(plugin) {
                return plugin.id == pluginConf.pluginId;
            });
            if (plugin.length != 1) {
                throw new Error("No such plugin exist (" + pluginConf.pluginId + ")");
            }
            pluginConf.plugin = plugin[0];
            pluginConf.canHandle = pluginConf.canHandle || pluginConf.plugin.canHandle.bind(pluginConf.plugin);
        }

        // For each application's plugin reference - find the
        // plugin object and bind it to the plugin configuration object:
        Applications.applications().forEach(function(application) {
            application.navigationPluginConfs.forEach(function(pluginConf) {
                bindPlugin(pluginConf, allNavigationPlugins);
            });
            application.contentPluginConfs.forEach(function(pluginConf) {
                bindPlugin(pluginConf, allContentPlugins);
            });
        });


		$rootScope.$watch(function() {
			return Applications.currentApplication();
		},
		function(app) {
			if (app == undefined) {
				return;
			}

			service.refresh();
		});

		$rootScope.$watch(function() {
			return Navigation.currentNavigationNode();
		},
		function(currentNavigationNode, oldNavigationNode) {
			if (currentNavigationNode == undefined) {
				return;
			}

            if (oldNavigationNode != null) {
                service.navigationPluginLoadingFailed(false);
                service.contentPluginLoadingFailed(false);
            }

			service.refresh();
		});


        deferredCurrentNavigationPluginConf = null;
        deferredCurrentContentPluginConf = null;
		var service = {
			navigationPluginConfs			: function() {
                /*
                return: an Array of the current application's navigation
                        plugin configuration objects which canHandle()
                        Navigation.currentNavigationNode().
                        Or in other words - all the plugin configuration
                        objects which are available for usage right now.
                 */
				return navigationPluginConfs;
			},

			contentPluginConfs				: function() {
                /*
                This is the same as navigationPluginConfs,
                but for content plugin configurations.
                 */
				return contentPluginConfs;
			},

			currentNavigationPluginConf		: function(pluginConf) {
                /*
                If called with no argument, return the current navigation
                plugin configuration (associated with the plugin the user
                is currently viewing).
                If given an argument, set the current navigation plugin
                configuration object to the given plugin configuration object.
                pluginConf must be inside navigationPluginConfs.
                 */
				if (pluginConf === undefined) {
					return currentNavigationPluginConf;
				}

				if (pluginConf !== null && (navigationPluginConfs || []).indexOf(pluginConf) == -1) {
                    if (navigationPluginConfs == undefined || navigationPluginConfs.length == 0) {
                        // Defer for later. This is needed for instance when the user has entered a URL which refers to a specific node and plugin, but creating the node takes time.
                        deferredCurrentNavigationPluginConf = pluginConf;
                        return;
                    }
                    deferredCurrentNavigationPluginConf = null;
					throw "illegal plugin";
				}

                if (currentNavigationPluginConf != null && currentNavigationPluginConf != pluginConf) {
                    navigationPluginLoading.reset();
                }

				currentNavigationPluginConf = pluginConf;
                if (pluginConf !== null) {
                    deferredCurrentNavigationPluginConf = null;
                }
			},

			currentContentPluginConf		: function(pluginConf) {
                /*
                This is the same as currentNavigationPluginConf,
                but for content plugin configurations.
                 */
				if (pluginConf === undefined) {
					return currentContentPluginConf;
				}

				if (pluginConf !== null) {
					if ((contentPluginConfs || []).indexOf(pluginConf) == -1) {
                        if (contentPluginConfs == undefined || navigationPluginConfs.length == 0) {
                            // Defer for later. This is needed for instance when the user has entered a URL which refers to a specific node and plugin, but creating the node takes time.
                            deferredCurrentContentPluginConf = pluginConf;
                            return;
                        }
                        deferredCurrentContentPluginConf = null;
						throw "illegal plugin";
					}
				}
				//TODO: IF pluginConf === null, AND THERE'S NO PLUGIN WHICH canHandle() RIGHT NOW, NOTHING SHOULD BE DISPLAYED

                if (currentContentPluginConf != null && currentContentPluginConf != pluginConf) {
                    contentPluginLoading.reset();
                }

				currentContentPluginConf = pluginConf;
                if (pluginConf !== null) {
                    deferredCurrentContentPluginConf = null;
                }
			},

            navigationPluginLoading     : function(loading) {
                /*
                When the navigation plugin is in loading state, the user
                sees a loading animation.

                If this function is called with no argument, return the loading
                status of the navigation plugin.

                If called with true, transition into loading state. The return
                value will be a token whose usage will be described next.

                If called with a token, transition back into the regular state
                (not loading).

                Note: if this function called multiple times with true, the
                transition to regular state will be made only after the function
                will be called with all of the tokens. This mechanism enables
                multiple entities to declare they are loading data, and only
                when all of them finish will the user get notified (the loading
                animation will disappear).
                 */
                if (loading == undefined) {
                    return navigationPluginLoading.isLoading();
                }

                if (loading === true) {
                    return navigationPluginLoading.loading();
                }
                else {
                    navigationPluginLoading.unloading(loading);
                }
            },

            contentPluginLoading            : function(loading) {
                /*
                This is the same as navigationPluginLoading,
                but for the content plugin.
                 */
                if (loading == undefined) {
                    return contentPluginLoading.isLoading();
                }

                if (loading === true) {
                    return contentPluginLoading.loading();
                }
                else {
                    contentPluginLoading.unloading(loading);
                }
            },

            navigationPluginLoadingFailed   : function(failed) {
                /*
                When the navigation plugin is in "failed to load" state, the
                user sees a "failed loading" animation.

                If this function is called with no argument, return whether
                the navigation plugin is in "failed loading" state.

                When called with a boolean, set the "failed loading"
                state accordingly.

                Note: once entered the "loading failed" state, calling
                navigationPluginLoading(true) will transition to the
                "loading" state. Any tokens retrieved previously by
                navigationPluginLoading(true) will be ignored.
                This means that if two entities call
                navigationPluginLoading(true), and then one of them call
                navigationPluginLoadingFailed(true) - the tokens retrieved
                by both of them will be ignored. This means that if a third
                entity calls token = navigationPluginLoading(true) (causing
                the transition to "loading" state), and then later calls
                navigationPluginLoading(token), the plugin will transition
                to the "regular" (not loading) state.
                 */
                if (failed === undefined) {
                    return navigationPluginLoading.loadingFailed();
                }

                navigationPluginLoading.loadingFailed(failed);
            },

            contentPluginLoadingFailed      : function(failed) {
                /*
                This is the same as navigationPluginLoadingFailed,
                but for the content plugin.
                 */
                if (failed === undefined) {
                    return contentPluginLoading.loadingFailed();
                }

                contentPluginLoading.loadingFailed(failed);
            },

            refresh                         : (function() {
                /*
                Refresh the available plugin configurations.
                This consists of two steps:
                1. Update contentPluginConfs and navigationPluginConfs (so they'll
                   contain all the current application's plugin configurations which
                   canHandle() the current navigation node's item).
                2. Change the current content and navigation plugin
                   configurations if they aren't available anymore
                   (if contentPluginConfs / navigationPluginConfs
                   doesn't contain it).

                This function is called automatically when the current
                application / navigation node changes, but it can also be called by
                users (who inject the Plugins service). This should be done, for
                example, when the current navigation node's item has changes in
                a way that some plugins' canHandle has flipped).
                 */
                function refresh() {
                    var app = Applications.currentApplication();
                    var node = Navigation.currentNavigationNode();
                    if (app == null || node == null) {
                        navigationPluginConfs = [];
                        contentPluginConfs = [];
                        service.currentNavigationPluginConf(null);
                        service.currentContentPluginConf(null);
                        return;
                    }

                    if (app === refresh.last.app && node === refresh.last.node) {
                        return;
                    }

                    // Update the available plugins:
                    contentPluginConfs = app.contentPluginConfs.filter(function(pluginConf) {
                        return pluginConf.canHandle(node.item);
                    });
                    navigationPluginConfs = app.navigationPluginConfs.filter(function(pluginConf) {
                        return pluginConf.canHandle(node);
                    });

                    // Do deferred work:
                    if (deferredCurrentNavigationPluginConf != null) {
                        try {
                            service.currentNavigationPluginConf(deferredCurrentNavigationPluginConf);
                        }
                        catch(e) {
                            // The plugin is illegal. Never mind - we'll use some other one later...
                        }
                    }
                    if (deferredCurrentContentPluginConf != null) {
                        try {
                            service.currentContentPluginConf(deferredCurrentContentPluginConf);
                        }
                        catch(e) {
                            // The plugin is illegal. Never mind - we'll use some other one later...
                        }
                    }

                    // Change the current plugins if we have to:
                    if (contentPluginConfs.indexOf(currentContentPluginConf) == -1) {
                        service.currentContentPluginConf(contentPluginConfs[0]);
                    }
                    if (navigationPluginConfs.indexOf(currentNavigationPluginConf) == -1) {
                        service.currentNavigationPluginConf(navigationPluginConfs[0]);
                        if (currentContentPluginConf && ! currentContentPluginConf.canHandle(node.item)) {
                            service.currentContentPluginConf(null);
                            contentPluginConfs.some(function(pluginConf) {
                                if (pluginConf.canHandle(node.item)) {
                                    service.currentContentPluginConf(pluginConf);
                                    return true;
                                }
                            });
                        }
                    }
                }
                refresh.last = {
                    app     : undefined,
                    node    : undefined
                };

                return refresh;
            }())
		};

        return service;
	};
});