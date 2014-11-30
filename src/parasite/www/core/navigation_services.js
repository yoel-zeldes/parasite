angular.module('core.navigation')
.service('Navigation', function(Applications) {
	var currentNavigationModel = null;
	var currentNavigationNode = null;

	return {
		currentNavigationModel	: function(model) {
            /*
            If called with no argument, return the current navigation model.
            If called with a NavigationNode, set the current model accordingly,
            and reset the currentNavigationNode (as it's no longer valid).
             */
			if (model === undefined) {
				return currentNavigationModel;
			}

            if (currentNavigationModel !== model) {
			    currentNavigationModel = model;
                currentNavigationNode = null;
            }
		},

		currentNavigationNode	: function(node) {
            /*
            If called with no argument, return the current navigation node (the
            node selected by the user).
            If called with a NavigationNode, set the current navigation node
            accordingly.
             */
			if (node == undefined) {
				return currentNavigationNode;
			}

			currentNavigationNode = node;
		},

		idToNavigationNode		: function(id) {
            /*
            Translate the given string id to the the NavigationNode with the
            same id. If necessary - expand the navigation model in the
            search process.

            param id: the string id to look for.

            return: a promise which will be resolved with the result
                    NavigationNode, or null if the id hasn't been found.
             */
			return this.currentNavigationModel().findByExpanding(id, Applications.currentApplication());
		},

		navigationNodeToId		: function(node) {
            /*
            Translate the given NavigationNode to a string id.

            param node: the NavigationNode to query.

            return: the node's string id.
             */
			return node.id;
		}
	};
});