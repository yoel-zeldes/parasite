angular.module('core.navigation')
.service('NavigationModel', function($q) {
	function recursiveFind(id, node) {
		if (node.id == id) {
			return node;
		}

		//TODO: this is highly inefficient...
		for (var i = 0; i < node.kids.length; ++i) {
			var foundNode = recursiveFind(id, node.kids[i]);
			if (foundNode) {
				return foundNode;
			}
		}

		return null;
	}

	function updateId(node) {
		var oldId = node.id;

		if (node.parent == undefined) {
			node.id = "/";
		}
		else {
			node.id = "/" + node.name;
			if (node.parent.id != "/") {
				node.id = node.parent.id + node.id;
			}
		}

		if (node.id != oldId) {
			node.kids.forEach(updateId);
		}
	}

	var NavigationNode = Class.extend({
        /*
        This class represents a node in a tree structure.
         */
		init : function(name, item, kids, parent) {
            /*
            Constructor.

            param name: the name of the node. It's used to construct the node's
                        id: the id is defined to be the names of all the nodes
                        in the path from the root to this node separated by '/'.
                        The id is put in the id attribute.
            param item: application specific data. Can be everything.
            param kids: an Array of NavigationNodes. These are assigned to the
                        kids attribute.
                        Note that every kid's parent attribute is updated to
                        the node created by the constructor, and the id
                        attribute is updated as well (as the parent has
                        changed).
                        This parameter can also be a number. If given a number,
                        we enter the lazy mode: the node created by the
                        constructor has numOfKids attribute which is assigned
                        to be the given number. The node's kids attribute is
                        assigned an empty Array. Users of the NavigationNode
                        can later on use numOfKids in order to call the expand
                        function attribute.
            param parent: the parent NavigationNode (or undefined if this is
                          the root NavigationNode).
             */
			if (name == undefined) {
				throw new Error("NavigationNode must have a name");
			}
			if (typeof(name) !== "string") {
				throw new Error("name must be a string");
			}
			if (name.indexOf('/') >= 0) {
				throw new Error("name can't contain '/'");
			}
			if (item === undefined) {
				throw new Error("NavigationNode must have an item");
			}
            if (parent != undefined && !(parent instanceof NavigationNode)) {
                throw new Error("parent must be undefined or instance of NavigationNode");
            }

            this.item = item;
			this.name = String(name);
            this.kids = [];
			this.parent = parent;

			updateId(this);

            if (kids instanceof Array) {
                var self = this;
                kids.forEach(function(kid) {
                    if (!(kid instanceof NavigationNode)) {
                        throw new Error("kids must be instances of NavigationNode");
                    }
                    kid.parent = self;
                    updateId(kid);
                });
                this.kids = kids;
                this._checkKids();
                this.numOfKids = kids.length;
            }
            else {
                this.kids = [];
                this.numOfKids = kids;
            }
		},

        _checkKids : function() {
            /*
            Make sure all of the direct kids of this node have a different id.
             */
            var ids = {};
            this.kids.forEach(function(kid) {
                if (ids[kid.id] != undefined) {
                    throw new Error("kids must have different ids");
                }
                ids[kid.id] = 1;
            });
        },

		update : function(kids, startIndex) {
            /*
            Update the kids of this node by the given kids.

            param kids: an Array of NavigationNodes, or a single NavigationNode
                        (which is equivalent to an Array with a single
                        NavigationNode).
                        Can also be a promise of NavigationNode Array.
                        Their parent and id attributes will automatically
                        be updated.
            param startIndex: the index of the first kid of this NavigationNode
                              at which the update should start, e.g. if
                              startIndex = 3, the first three kids will be left
                              untouched, while the fourth kid will be the first
                              kid of the given kids.
                              If undefined, all of this.kids will be overridden
                              by the given kids, even if
                              kids.length < this.kids.length.

            return: a promise which will be resolved when the update process is
                    finished (if the given kids is a promise, the returned
                    promise will be resolved after kids is resolved,
                    otherwise - it'll be resolved immediately at the
                    end of the function execution).
             */
			var self = this;

			function updateWithKids(kids) {
                if (kids instanceof NavigationNode) {
                    kids = [kids];
                }

				if (startIndex == undefined) {
					self.kids = [];
					startIndex = 0;
				}

                kids.forEach(function(kid) {
                    if (! (kid instanceof NavigationNode)) {
                        throw new Error("must update with NavigationNodes");
                    }
                });

                kids.forEach(function(kid, i) {
					kid.parent = self;
					updateId(kid);
					self.kids[startIndex + i] = kid;
				});
                self._checkKids();

                self.numOfKids = Math.max(self.numOfKids || 0, self.kids.length);

				return self.kids;
			}

			if (kids instanceof Array || kids instanceof NavigationNode) {
				return $q.when(updateWithKids(kids));
			}
			else {
				return kids.then(updateWithKids);
			}
		},

		find : function(id) {
            /*
            return: the NavigationNode with the given id, or null if not found.
                    The search process starts at this NavigationNode and
                    drills down into the tree.
             */
			return recursiveFind(id, this);
		},

		findByExpanding : function(id, application) {
            /*
            The same as the find method, except that if in the search process
            there are nodes whose kids haven't been calculated yet, do the
            calculation right now.

            param id: the id to search for.
            param application: the application object who is responsible fot
                               the navigation nodes. The application's getKids
                               function will be called in order to perform
                               the expansion.

            return: a promise which will be resolved with the result
                    NavigationNode, or null if the id hasn't been found.
             */
			function findNavigationNodeInExpanded(currentStepNode, nextStepId) {
				if (remainingIdParts.length == 0) {
					deferred.resolve(currentStepNode);
					return;
				}

				if (currentStepNode === null) {
					deferred.resolve(null);
					return;
				}

				nextStepId += "/" + remainingIdParts.splice(0, 1);
				currentStepNode.expand(application).then(function() {
					currentStepNode = currentStepNode.find(nextStepId);
					findNavigationNodeInExpanded(currentStepNode, nextStepId);
				});
			}

			var remainingIdParts = id.split("/").slice(1);
			var deferred = $q.defer();
			findNavigationNodeInExpanded(this, "");

			return deferred.promise;
		},
		
		expand : function(application, startIndex, endIndex) {
            /*
            Expand the kids of this NavigationNode.
            The kids are calculated using the given application, and then
            this.update is called to update this.kids accordingly.

            param application: the application object who is responsible fot
                               the navigation nodes. The application's getKids
                               function will be called in order to perform
                               the expansion.
            param startIndex: the index of the first kid of this NavigationNode
                              which should be expanded.
            param endIndex: the index of the last kid of this NavigationNode
                            which should be expanded plus one.

            return: a promise which will be resolved when the
                    expansion process is finished.
             */
			var self = this;

			if (startIndex == undefined) {
				startIndex = 0;
			}
			if (endIndex == undefined) {
				endIndex = self.numOfKids;
			}
			
			var hasUndefined = false;
			for (var i = startIndex; i < endIndex; ++i) {
				if (self.kids[i] == undefined) {
					hasUndefined = true;
					break;
				}
			}

			if (!hasUndefined) {
				return $q.when();
			}

            return $q.when(application.getKids(self, startIndex, endIndex))
                .then(function(kids) {
                    self.update(kids, startIndex);
                });
		}
	});

	return {NavigationNode : NavigationNode};
});