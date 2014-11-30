angular.module("general.plugins")
.controller("TreeNavigationCtrl", ['$scope', 'Applications', 'Navigation', 'Plugins', utils.BaseNavigationCtrl.extend({
	init			: function($scope, Applications, Navigation, Plugins) {
		this._super($scope, Navigation, Plugins);

		this.Applications = Applications;

		var self = this;
		self.barHeight = 25;
		self.margin = {
				top : 30,
				right : 20,
				bottom : 30,
				left : 20
		};
		self.indentSize = 25.5;
		self.treeLayout = undefined;
		self.svg = undefined;
		self.barPadding = 5.5;
		self.duration = 400;

		var parentDiv = $("#tree"),
		width = parentDiv.width() - self.margin.right - self.margin.left,
		barWidth = width * .8;

		self.treeLayout = d3.layout.tree().size([0, 0])
		.children(function(d) {
			return self.tree(d).isExpanded ? d.kids : [];
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

			model.kids.forEach(self.collapse.bind(self));
		});

		self.$scope.$watch(function() {
			return self.Navigation.currentNavigationNode();
		},
		function(newValue, oldValue) {
			if (newValue == null || newValue == undefined) {
				return;
			}
			
			if (newValue.parent) {
				self.expand(newValue.parent);
			}
			self.update(newValue);

			scrollToCurrent();
		});

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
					self.Navigation.currentNavigationNode(d);
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
				if (self.isExpanded(d)) {
					self.Navigation.currentNavigationNode(d.kids[0]);
				}
				else {
					self.navigateToAndToggle(d);
				}
				break;

			case 37:
				// Left
				var d = self.Navigation.currentNavigationNode();
				if (self.isCollapsed(d) && d.parent) {
					self.Navigation.currentNavigationNode(d.parent);
				}
				else {
					self.collapse(d);
					self.update(d);
				}
				break;
			}
		}
	},

	update			: function(source) {

		var self = this;

		function arrowIcon(d) {
			return self.isExpanded(d) ? "\uf0d7" : self.hasKids(d) ? "\uf0da" : "";
		}

		// Compute the new tree layout.
		var nodes = self.treeLayout.nodes(self.Navigation.currentNavigationModel())

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
		var node = self.svg.selectAll("g.node")
		.data(nodes, function(d) { return d.id });

		var nodeEnter = node.enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) { return "translate(" + source.y0 + ", " + source.x0 + ")"; })
		.style("opacity", 1e-6);

		// Enter any new nodes at the parent's previous position.
		nodeEnter.append("rect")
		.attr("y", -self.barHeight / 2)
		.attr("height", self.barHeight)
		.attr("rx", "3")
		.attr("ry", "3")
        .attr("class", "row")
		.on("click", function(d) {
			self.Navigation.currentNavigationNode(d);
		})
		.on("dblclick", function(d) {
			self.navigateToAndToggle(d);
		});
        node.selectAll("rect.row")
		.attr("class", function(d) { return "row " + (d == self.Navigation.currentNavigationNode() ? "selected" : "");});

		nodeEnter.append("text")
		.attr("class", "arrow fa")
		.attr("dx", -12)
		.attr("dy", 5)
		.text(arrowIcon)
		.on("click", function(d) {
			self.navigateToAndToggle(d);
		});

		nodeEnter.append("text")
		.attr("class", "type fa")
		.attr("style", function(d) { return "fill: " + self.Applications.currentApplication().getVisualization(d.item).icon.fgColor; })
		.attr("dy", 5)
		.attr("dx", self.barPadding)
		.text(function(d) { return self.Applications.currentApplication().getVisualization(d.item).icon.text; });

		nodeEnter.append("text")
		.attr("class", "nodeName")
		.attr("dy", 5)
		.attr("dx", self.indentSize)
		.text(function(d) { return d.name });

		// Set the rect width according to the text width.
		nodeEnter.selectAll("rect.row")
		.attr("width", function(d) { return self.indentSize + self.barPadding + $(this.parentNode).find(".nodeName")[0].getBoundingClientRect().width; });

		// Transition nodes to their new position.
		nodeEnter.transition()
		.duration(self.duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
		.style("opacity", 1);

		node.transition()
		.duration(self.duration)
		.attr("transform", function(d) { return "translate(" + d.y + ", " + d.x + ")"; })
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

	renderModel		: function () {
		var self = this;

		var currentNode = self.Navigation.currentNavigationNode();

		currentNode.kids.forEach(self.collapse.bind(self));

		if (currentNode.parent) {
			self.expand(currentNode.parent);
		}

		self.update(currentNode);
	},

	isExpanded		: function(d) {
		var self = this;
		return self.tree(d).isExpanded;
	},

	isCollapsed		: function(d) {
		var self = this;
		return ! self.isExpanded(d);
	},

	hasKids		: function(d) {
		return d.numOfKids > 0;
	},

	collapse		: function(d) {
		var self = this;
		if (self.isExpanded(d)) {
			d.kids.forEach(self.collapse.bind(self));
			self.tree(d).isExpanded = false;
		}
	},

	expand			: function(d) {
		var self = this;
		if (d.parent) {
			self.expand(d.parent);
		}
		if (self.isCollapsed(d)) {
			self.tree(d).isExpanded = true;
		}
	},

	navigateToAndToggle		: function(node) {
		var self = this;

        self.navigateTo(node, function() {
            node.expand(self.Applications.currentApplication())
                .then(function() {
                    if (self.isExpanded(node)) {
                        self.collapse(node);
                    } else {
                        self.expand(node);
                    }

                    self.renderModel();
                });
        });
	},
	
	tree            : function(d) {
		d.tree = d.tree || {
			isExpanded : false
		};
		return d.tree;
	}
})]);