angular.module('core.applications')
.provider('Applications', function() {
    this.Application = Class.extend({
        /*
        This is the base class for creating new applications.
        One should extend() this class, instantiate the new class,
        and register() it (using Applications.register()).
        */
        init	: function(name, navigationPluginConfs, contentPluginConfs) {
            /*
            Constructor.

            param name: the application's name.
            param navigationPluginConfs: the navigation plugins used by the application.
                                         Should be an Array of objects, each containing
                                         the fields pluginId and repr (and optionally
                                         canHandle function).
                                         Read more about it at http://127.0.0.1:8000/app/devcenter/creating%20an%20app/the%20application.
             */
            if (navigationPluginConfs == undefined || navigationPluginConfs.length == 0) {
                throw new Error("navigationPluginConfs can't be empty");
            }
            if (contentPluginConfs == undefined || contentPluginConfs.length == 0) {
                throw new Error("contentPluginConfs can't be empty");
            }

            this.name = name;
            this.navigationPluginConfs = navigationPluginConfs;
            this.contentPluginConfs = contentPluginConfs;
        },

        getNavigationModel : function(update) {
            /*
            Create and return the application's navigation model.

            param update: if given true, an updated navigation model should be
                          returned (e.g. - if the data on the server side used
                          by the navigation model might have changed -
                          construct a new model reflecting the changes).

            return: a NavigationNode, or a promise of a NavigationNode.
             */
            throw new Error("Not implemented");
        },

        getKids : function(node, startIndex, endIndex) {
            /*
            Create NavigationNodes which are the kids of the given node.

            param node: a NavigationNode whose kids are being queried.
            param startIndex: the index of the first kid to query.
            param endIndex: the index of the last kid to query plus one.

            return: an Array of NavigationNodes, or a promise of such an Array.
             */
            throw new Error("Not implemented");
        },

        isNavigationLinkedToUrl : function() {
            /*
            return: true iff the URL is linked to the current navigation node.
                    If it is, the user can navigate in the application by
                    navigating to a different URL.
             */
            return true;
        },

        isLoginSupported : function() {
            /*
            return: true iff the application requires user login
                    in order to perform some actions.
             */
            return false;
        },

        getVisualization : function(item) {
            /*
            Given an item (from the navigation model) return info about
            how a navigation plugin should display it.

            param item: the item encapsulated by one of the NavigationNodes
                        in the navigation model

            return: an object with the following properties:
                    {
                        icon        : {
                            text    : "",
                            fgColor : "",
                            bgColor : ""
                        },
                        dataTitles  : [],
                        data        : []
                    }
                    - icon: how should the item's icon look like?
                        - text: the text of the icon. One can use font awesome
                          and fill this text with the appropriate unicode value
                          of the desired icon.
                        - fgColor: the foreground font color.
                        - bgColor: the background color.
                    - dataTitles: an Array of objects describing the properties
                      of an item. Each such object contains a string named
                      title (which is used, for example, as the header of the
                      table created by the table navigation plugin), and a
                      boolean named sortable (which states if the server side
                      supports sorting based on this property).
                      This data shouldn't be specific to the given item.
                    - data: an Array of strings containing the item's data.
                      This data is used, for example, as the contents of the
                      rows of the table created by the table navigation plugin.
                      This data should be specific to the given item.
             */
            return {
                icon        : {
                    text    : "",
                    fgColor : "",
                    bgColor : ""
                },
                dataTitles  : [],
                data        : []
            };
        }
    });


    var applications = [];
    this.register = function(app) {
        /*
        Register the given application to the available applications.

        param app: an instance of a class extending the Application class.
         */
        applications.push(app);
    };

    this.$get = function() {
        var currentApplication = null;

        return {
            applications		: function() {
                /*
                return: an Array of all of the registered applications.
                 */
                return applications;
            },

            currentApplication	: function(application) {
                /*
                When called with no argument, return the current application.
                When called with an application, set the current application
                to the given one.
                 */
                if (application == undefined) {
                    return currentApplication;
                }

                currentApplication = application;
            }
        };
    };
});