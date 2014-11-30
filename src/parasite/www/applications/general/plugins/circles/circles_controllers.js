angular.module("general.plugins")
.controller("CirclesNavigationCtrl", ['$scope', 'Applications', 'Navigation', 'Plugins', '$q', utils.BaseNavigationCtrl.extend({
	init			: function($scope, Applications, Navigation, Plugins, $q) {
		this._super($scope, Navigation, Plugins);

		this.Applications = Applications;
		this.Navigation = Navigation;

		var self = this;

		function expandIfNotSized(node) {
			if (node.item.size != undefined) {
				return $q.when();
			}
			
			return node.expand(self.Applications.currentApplication())
			.then(function() {
				return $q.all(node.kids.map(expandIfNotSized))
			})
			.then(function() {
				node.item.size = node.kids.map(function(kid) {
					return kid.item.size;
				})
				.reduce(function(size1, size2) {
					return size1 + size2;
				});
			});
		}
		
		expandIfNotSized(self.Navigation.currentNavigationModel())
		.then(createCircles);

		function createCircles() {
			var parentDiv = $("#circles"),
			width = parentDiv.width(),
			diameter = width,
			x = d3.scale.linear().range([0, diameter]),
			y = d3.scale.linear().range([0, diameter]),
			duration = {"short": 375,"sababa": 750, "long": 7500},
			node,
			nodes;

			var pack = d3.layout.pack()
			.size([diameter, diameter])
			.children(function(d) {
				var current = self.Navigation.currentNavigationNode();
				while (current) {
					if (d === current) {
						return d.kids;
					}
					
					current = current.parent;
				}
				return [];
			})
			.value(function(d) {
				return d.item.size;
			});

			var vis = d3.select("#circles")
			.insert("svg")
			.attr("viewBox", "0 0 " + diameter + " " + diameter)
			.attr("preserveAspectRatio", "xMidYMid meet")
			.append("g")

			update();

			self.$scope.$watch(function() {
				return self.Applications.currentApplication();
			},
			function(application, oldApplication) {
				if (application != oldApplication) {
					// Check if there are any nodes already. (there is a circles on screen)
					if (nodes) {
						var cleanAnimations = 0;
						var maxDepth = 0;


						// Detect the maximum depth.
						nodes.forEach(function(d) {
							if (d.depth > maxDepth) {
								maxDepth = d.depth;
							}
						});

						// Zoom out and clean all elements of the circles off the screen.
						zoom(self.Navigation.currentNavigationModel(), application, function(application) {
							var clean = vis.transition().ease("cubic-in-out");

							clean.selectAll("circle")
							.duration(function(d) { return duration.short / 2 + (Math.random() * (duration.short / 2)); })
							.delay(function(d) { return ((maxDepth - d.depth) * duration.short) / 2; })
							.attr("r", function(d) { return d.r + 1 + d.depth / 2; })
							.transition()
							.each("end", function(d) { cleanAnimations++; cleanAnimations == nodes.length ? update() : ""; })
							.duration(duration.short)
							.attr("r", 1e-6)
							.remove();

							clean.selectAll("text")
							.duration(duration.short)
							.delay(function(d) { return ((maxDepth - d.depth) * duration.short) / 2; })
							.attr("opacity", 0)
							.remove();
						});
					}
				}
			});

			function dataBind(d) {
				return d.id;
			}

			function update() {
				var navigationModel;
				node = navigationModel = self.Navigation.currentNavigationModel();

				var animations = 0;
				var maxDepth = 0;
				nodes = pack.nodes(navigationModel);
				circles = vis.selectAll("circle").data(nodes, dataBind)
				texts = vis.selectAll("text").data(nodes, dataBind)

				// Append new circles
				circles.enter().append("circle")
				.attr("class", function(d) { return d.kids ? "parent" : "child"; })
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
				.attr("r", function(d) { d.kids ? d.r : d.r = d.r -1; return 1e-6; })
				.attr("id", function(d) { return d.id; })
				.on("click", function(d) { return click(node == d ? navigationModel : d); });

				// Append new texts
				texts.enter().append("text")
				.attr("class", function(d) { return d.kids ? "parent" : "child"; })
				.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })
				.attr("dy", ".35em")
				.attr("text-anchor", "middle")
				.style("opacity", 0)
				.text(function(d) { return d.name });

				// Update all circles
				circles.transition().ease("cubic-in-out")
				.duration(function(d) { return duration.short + (Math.random() * (duration.short / 2)); })
				.delay(function(d) { return (d.depth * duration.short) / 2; })
				.attr("r", function(d) { return d.r + 1 + d.depth / 2; })
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
				.transition()
				.each("end", function(d) { animations++; animations == nodes.length ? updateNavigation(self.Navigation.currentNavigationNode(),"") : "" })
				.duration(duration.short / 2)
				.attr("r", function(d) { return d.r; });

				// Update all texts
				texts.transition().ease("cubic-in-out")
				.duration(duration.short)
				.delay(function(d) { return (d.depth * duration.short) / 2; })
				.attr("x", function(d) { return d.x; })
				.attr("y", function(d) { return d.y; })
				.style("opacity", function(d) { return d.r > 20 ? 1 : 0; });

				// Detect the maximum depth.
				nodes.forEach(function(d) {
					if (d.depth > maxDepth) {
						maxDepth = d.depth;
					}
				});

				// Delete the exiting nodes
				// TODO: Insert transitions. (and make it work, 'cause currently it doesn't)
				circles.exit().remove();
				texts.exit().remove();

			};

			function zoom(d, application, callback) {
				var k = diameter / d.r / 2;
				x.domain([d.x - d.r, d.x + d.r]);
				y.domain([d.y - d.r, d.y + d.r]);

				var zoomAnimations = 0;

				var t = vis.transition()
				.duration(duration.sababa);

				t.selectAll("circle")
				.attr("cx", function(d) { return x(d.x); })
				.attr("cy", function(d) { return y(d.y); })
				.attr("r", function(d) { return k * d.r; });

				t.selectAll("text")
				.attr("x", function(d) { return x(d.x); })
				.attr("y", function(d) { return y(d.y); })
				.style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; });

				if (callback) {
					t.each("end", function(d) { callback(application) });
				}

				node = d;
				if (d3.event) {
					d3.event.stopPropagation();
				}
			}

			function click(d) {
				function navigateTo() {
                    self.navigateTo(d, update);
				}

				if (d.numOfKids > 0) {
					d.expand(self.Applications.currentApplication()).then(navigateTo);
				}
				else {
					navigateTo();
				}
			}

			function updateNavigation(navigationNode, oldNavigationNode) {
				if (navigationNode == undefined || oldNavigationNode == undefined || navigationNode == oldNavigationNode) {
					return;
				}

				zoom(self.Navigation.currentNavigationModel().find(navigationNode.id));
			}

			self.$scope.$watch(function() {
				return self.Navigation.currentNavigationNode();
			},
			updateNavigation);
		}
	}
})]);