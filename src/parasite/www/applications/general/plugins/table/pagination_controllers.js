//TODO: a lot of the table code is copied from the tree code, as it was written in an hard to understand and extend manner. This code duplication should be eliminated, by rewriting the basictree.
angular.module("general.plugins")
.controller("NodesPaginationCtrl", function($scope, Applications, Plugins, Navigation) {
	var self = this;

	self.Applications = Applications;
	
	function getPage(node) {
		var index = $scope.root().kids.indexOf(node);
		if (index >= 0) {
			return Math.floor(index / $scope.nodesPerPage);
		}
		
		return 0;
	}
	
	function updatePage(node) {
		if (node === $scope.root()) {
			return;
		}

		$scope.current.page = getPage(node);
	}
	
	$scope.current = {page : 0};
	$scope.nodesPerPage = 30;

	$scope.pages = 0;
    function updatePages() {
        $scope.pages = Math.ceil($scope.root().numOfKids / $scope.nodesPerPage);
    }
	
	var root = undefined;
	$scope.root = function(newRoot) {
		if (newRoot === undefined) {
			return root;
		}
		if (newRoot === root) {
			return;
		}

		var oldRoot = root;
		root = newRoot;
        updatePages();
		updatePage(oldRoot);
	};
	
	$scope.kids = function() {
		if (root == undefined) {
			return null;
		}
		
		var min = $scope.current.page * $scope.nodesPerPage;
		var max = ($scope.current.page + 1) * $scope.nodesPerPage;
		return root.kids.filter(function(c, i) {
			return i >= min && i < max;
		});
	};

    var loadingToken;
    function unloading() {
        Plugins.navigationPluginLoading(loadingToken);
    }
	$scope.expandCurrentPage = function() {
		var startIndex = $scope.current.page * $scope.nodesPerPage;
		var endIndex = Math.min(($scope.current.page + 1) * $scope.nodesPerPage,
				$scope.root().numOfKids);

        unloading();
        loadingToken = Plugins.navigationPluginLoading(true);
        $scope.root().expand(self.Applications.currentApplication(), startIndex, endIndex)
            .then(unloading, function() {
                Plugins.navigationPluginLoadingFailed(true);
            });
	};

	
	$scope.$watch(function() {
		if ($scope.root() == undefined) {
			return undefined;
		}

		return $scope.current.page;
	},
	function(page) {
		if (page == undefined) {
			return;
		}
		
		$scope.expandCurrentPage();
	});
	
	$scope.$watch(function() {
		if ($scope.root() == undefined) {
			return undefined;
		}
	
		return Navigation.currentNavigationNode();
	},
	function(node) {
		if (node != undefined) {
			updatePage(node);
		}
	});

	$scope.$watch(function() {
		if ($scope.root() == undefined || Navigation.currentNavigationNode() == undefined) {
			return undefined;
		}

		return $scope.root().numOfKids;
	},
	function(numOfKids) {
		if (numOfKids != undefined) {
			updatePages();
            $scope.expandCurrentPage();
		}
	});
})


.controller("TableNavigationCtrl", ['$scope', 'Applications', 'Navigation', 'Plugins', 'Search', utils.BaseNavigationCtrl.extend({
	init			: function($scope, Applications, Navigation, Plugins, Search) {
		this._super($scope, Navigation, Plugins);

		this.Applications = Applications;
		this.Navigation = Navigation;
        this.Search = Search;

		var self = this;
		self.$scope.root(undefined);
		self.barHeight = 25;
		self.margin = {
				top : 30,
				right : 20,
				bottom : 30,
				left : 20
		};
		self.indentSize = 27;
		self.treeLayout = undefined;
		self.svg = undefined;
		self.iconWidth = 7;
        self.paddingWidth = 20;
		self.duration = 400;

		var parentDiv = $("#tree"),
		width = parentDiv.width() - self.margin.right - self.margin.left,
		barWidth = width * .8;

		self.treeLayout = d3.layout.tree().size([0, 0])
		.children(function(d) {
			return d === self.$scope.root() ? (self.hasTitle() ? [{id : null, name : ""}] : []).concat(self.$scope.kids()) : [];
		})
		.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		self.svg = d3.select("#tree")
		.append("svg")
		.append("g").attr("transform",
				"translate(" + self.margin.left + "," + self.margin.top + ")");

		self.$scope.$watch(function() {
			return self.Navigation.currentNavigationModel();
		},
		function(model) {
			if (model == undefined) {
				return;
			}
			self.getAllNodes().remove();

			self.$scope.root(model);
		});

		self.$scope.$watch(function() {
			return self.Navigation.currentNavigationNode();
		},
		function(newValue, oldValue) {
			if (newValue == undefined) {
				return;
			}
			
			if (newValue !== self.$scope.root() && newValue.parent !== self.$scope.root()) {
				self.$scope.root(newValue);
			}
			
			self.update(self.$scope.root());

			scrollToCurrent();
		});
		
		self.$scope.$watch(function() {
			return self.$scope.root();
		},
		function(newRoot, oldRoot) {
            // We check if newRoot != oldRoot for cases like where we change between tree and table plugins.
            // In this case, when we go to table, we don't want to navigate to the new root -
            // we want the root to be the current navigation node's parent, and the current node
            // to be the same.
            // We also check if Navigation.currentNavigationNode() == null
            // because when we load the page, we SHOULD navigate to the root.
            if (newRoot != undefined && (newRoot != oldRoot || Navigation.currentNavigationNode() == null)) {
                self.navigateToAndToggle(newRoot);
			}
		});

		self.$scope.$watchCollection(function() {
			return self.$scope.kids();
		},
		function(kids) {
			if (kids != undefined) {
				self.update(self.$scope.root());
			}
		});

        self.$scope.$watch(function() {
            var app = self.Applications.currentApplication();
            var kids = self.$scope.kids();
            if (kids == undefined) {
                return undefined;
            }

            var data = [];
            for (var i = 0; i < kids.length; ++i) {
                for (var j = app.getVisualization().dataTitles.length - 1; j >= 0; --j) {
                    data.push(app.getVisualization(kids[i].item).data[j]);
                }
            }

            return data;
        },
        function(data) {
            if (data != undefined) {
                self.update(self.$scope.root);
            }
        },
        true);

		function scrollToCurrent() {
			var allNodes = d3.selectAll("g.node");
			var current = self.Navigation.currentNavigationNode();
			allNodes.each(function(d, i) {
				if (d === current) {
					allNodes[0][i].scrollIntoViewIfNeeded();
				}
			});
		}

		function selectNeighbour(amount) {
			var selectedNodeY = self.Navigation.currentNavigationNode().x;
			var nextNodeY = selectedNodeY + self.barHeight * amount;

			var allNodes = d3.selectAll("g.node");
			allNodes.each(function(d, i) {
				if (d.x == nextNodeY) {
					self.navigateTo(d);
				}
			});
		}

		self.$scope.navigate = function(e) {
			switch(e.keyCode) {
			case 38:
				// Up
				selectNeighbour(-1);
				e.preventDefault();
				break;

			case 40:
				// Down
				selectNeighbour(1);
				e.preventDefault();
				break;

			case 33:
				// Page up
				selectNeighbour(-20);
				e.preventDefault();
				break

			case 34:
				// Page down
				selectNeighbour(20);
				e.preventDefault();
				break;

			case 39:
				// Right
				var d = self.Navigation.currentNavigationNode();
				if (d == self.$scope.root()) {
					self.navigateTo($scope.kids()[0]);
				}
				else {
					self.navigateToAndToggle(d);
				}
				break;

			case 37:
				// Left
				var d = self.Navigation.currentNavigationNode();
				if (d != self.$scope.root()) {
					self.navigateTo(self.$scope.root());
				}
				else if (d.parent != undefined) {
					self.navigateToAndToggle(d.parent);
				}
				break;
			}
		}
	},
	
	getAllNodes		: function() {
		var self = this;
		
		return self.svg.selectAll("g.node");
	},

    hasTitle        : function() {
        return this.$scope.kids().length > 0 && this.Applications.currentApplication().getVisualization().dataTitles.length > 0;
    },

	update			: function(source) {
		var self = this;

		function arrowIcon(d) {
			return d !== self.$scope.root() && self.hasKids(d) ? "\uf0a9" : "";
		}

        var app = self.Applications.currentApplication();

		// Compute the new tree layout.
		var nodes = self.treeLayout.nodes(self.$scope.root());

		// Set the tree and svg height according to the largest layer's node count.
		var treeHeight = nodes.length * self.barHeight,
		svgHeight = treeHeight + self.margin.bottom + self.margin.top;

		self.treeLayout.size([treeHeight, 0]);
		d3.select("svg").transition()
		.duration(self.duration)
		.attr("height", svgHeight);

		// Compute the "layout".
		nodes.forEach(function(n, i) {
			n.x = i * self.barHeight;
			n.y = n.depth * self.indentSize;
		});

		// Update the nodes...
		var node = self.getAllNodes()
		.data(nodes, function(d) { return d.id });

		var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + source.y0 + ", " + source.x0 + ")"; })
		.style("opacity", 1e-6);

        if (self.hasTitle()) {
            var nodeTitles = node.filter(function(d) { return d.id == null; });
            nodeEnter = nodeEnter.filter(function(d) { return d.id != null; });

            if (nodeTitles.selectAll("text")[0].length == 0) {
                for (var i = 0; i < app.getVisualization().dataTitles.length; ++i) {
                    var titleText = app.getVisualization().dataTitles[i].title;
                    nodeTitles.append("text")
                        .attr("style", "font-weight: bold")
                        .attr("class", "title-text")
                        .text(titleText);
                    nodeTitles.append("text")
                        .attr("dy", -self.barHeight)
                        .attr("class", "type fa title-arrow")
                        .text(self.Search.sort().sort == titleText ? (self.Search.sort().isAscending ? "\uf0d7" : "\uf0d8") : "");
                    var nodeTitleRects = nodeTitles.append("rect")
                        .attr("y", -self.barHeight * 2)
                        .attr("height", self.barHeight * 2)
                        .style("opacity", 0)
                        .attr("class", "title-rect")

                    if (app.getVisualization().dataTitles[i].sortable) {
                        var tip = d3.tip()
                            .attr('class', 'd3-tip')
                            .html(function(d) {
                                return "Sort by " + this;
                            }.bind(titleText));
                        nodeTitleRects.call(tip);
                        nodeTitleRects
                            .style("cursor", "pointer")
                            .on("click", function() {
                                tip.hide();
                                var title = String(this);
                                var isAscending = self.Search.sort().sort != title || !self.Search.sort().isAscending;
                                self.Search.sort(title, isAscending);
                            }.bind(titleText))
                            .on("mouseover", tip.show)
                            .on("mouseout", tip.hide)
                    }
                }
            }
        }

		d3.select("svg")
		.on("mousemove", function() {
			// Make the arrow of the pointed rect visible:
			var y = d3.mouse(this)[1];
			$(".arrow").hide();
			d3.selectAll("rect.row")[0].forEach(function(rect) {
				var top = $(rect).position().top;
				if (y > top & y < top + Number($(rect).attr("height"))) {
					$(rect).parent().find(".arrow").show();
				}
			});
		})
		.on("mouseout", function() {
			// Make all the arrows hidden: 
			var x = d3.mouse(this)[0];
			var y = d3.mouse(this)[1];
			
			if (x < 0 || y < 0 || x >= $("svg").width() || y >= $("svg").height()) {
				$(".arrow").hide();
			}
		});

		// Enter any new nodes at the parent's previous position.
		nodeEnter.append("rect")
            .attr("x", 3)
            .attr("y", -self.barHeight / 2 + 3)
            .attr("height", self.barHeight - 6)
            .attr("width", "21")
            .attr("rx", "3")
            .attr("ry", "3")
            .attr("style", function(d) { return "fill: " + (app.getVisualization(d.item).icon.bgColor || "#fff"); })
            .attr("class", "icon")
		nodeEnter.append("text")
            .attr("class", "type fa")
            .attr("style", function(d) { return "fill: " + app.getVisualization(d.item).icon.fgColor; })
            .attr("dy", 5)
            .attr("dx", self.iconWidth)
            .text(function(d) { return app.getVisualization(d.item).icon.text; });

        var prevColsWidth = 0;
        for (var i = 0; i < Math.max(1, app.getVisualization().dataTitles.length); ++i) {
            var dx = self.indentSize + prevColsWidth;
            nodeEnter.append("text")
                .attr("class", "node-data")
                .attr("dy", 5);
            var col = [];
            node.selectAll("text.node-data").forEach(function(texts) {
                col.push(texts[i]);
            });
            col = d3.selectAll(col);
            col
                .attr("dx", dx)
                .text(function(d, row) {
                    if (i == 0 && (!self.hasTitle() || row == 0)) {
                        return d.name;
                    }
                    return app.getVisualization(d.item).data[i];
                });

            var titleWidth = 0;
            if (self.hasTitle() && (nodeTitles.selectAll("text")[0] || {}).length > 0) {
                var title = $(nodeTitles.selectAll(".title-text")[0][i]);
                var titleArrow = $(nodeTitles.selectAll(".title-arrow")[0][i]);
                var titleRect = $(nodeTitles.selectAll(".title-rect")[0][i]);
                titleWidth = title.width();
                $(title).attr("dx", dx);
                titleArrow.attr("dx", dx + titleWidth / 2 - titleArrow.width() / 2);
                titleRect.attr("x", dx).attr("width", titleWidth);
            }

            prevColsWidth += self.paddingWidth + col[0].reduce(function(max, cell) {
                if (cell == null) {
                    return max;
                }
                var width = cell.getBoundingClientRect().width;
                if (max > width) {
                    return max;
                }
                return width;
            }, titleWidth);
        }

		nodeEnter.append("rect")
		.attr("y", -self.barHeight / 2)
		.attr("height", self.barHeight)
		.attr("rx", "3")
		.attr("ry", "3")
        .attr("class", "row")
		.on("click", function(d) {
			self.navigateTo(d);
		})
		.on("dblclick", function(d) {
			self.navigateToAndToggle(d);
		});
        node.selectAll("rect.row")
		.attr("class", function(d) { return "row " + (d == self.Navigation.currentNavigationNode() ? "selected" : "");});

		nodeEnter.append("text")
		.attr("class", "arrow fa")
		.attr("style", "display: none;")
		.attr("dx", -25)
		.attr("dy", 5)
		.on("click", function(d) {
			self.navigateToAndToggle(d);
		});
		node.selectAll(".arrow")
		.text(arrowIcon);

		// Set the rect width according to the text width.
		nodeEnter.selectAll("rect.row")
            .attr("width", function(d) {
                return self.indentSize + self.iconWidth + prevColsWidth - self.paddingWidth;
            })

		// Transition nodes to their new position.
		node.transition()
		.duration(self.duration)
		.attr("transform", function(d, i) { return "translate(" + d.y + ", " + (d.x + (self.hasTitle() && i > 0 ? self.barHeight : 0)) + ")"; })
		.style("opacity", 1);

		// Transition exiting nodes to the parent's new position.
		node.exit().transition()
		.duration(self.duration)
		.attr("transform", function(d) { return "translate(" + source.y + ", " + source.x + ")"; })
		.style("opacity", 1e-6)
		.remove();

		// Stash the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	},

	hasKids		: function(d) {
		return d.numOfKids > 0;
	},

	navigateToAndToggle		: function(node) {
		var self = this;
		self.navigateTo(node);
		
		if (!self.hasKids(node)) {
			return;
		}
		
		self.$scope.root(node);
		self.$scope.expandCurrentPage();
	}
})]);