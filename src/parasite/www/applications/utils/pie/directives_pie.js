angular.module('utils')
.directive('paraPie', function($q, percentsFilter) {
  return {
      restrict: 'E',
      scope: {
          slices    : '='
      },
      link: function(scope, element, attrs) {
          var Gui = Class.extend({
              init : function() {
                  var self = this;

                  self.width = element.parent().width();
                  self.piePadding = 100;
                  self.radius = self.width / 2 - self.piePadding;
                  self.slices = null;
                  self.sliceTitleTexts = null;
                  self.selectedSliceTitleText = null;
                  self.sliceInfoText = null;
                  self.percentsText = null;
                  self.colors = null;
                  self.blurredColors = null;
                  self.highlightedSliceIndex = null;

                  self.animationDuration = 1000;
              },

              createSvg : function(root) {
                  var self = this;

                  var width = (self.piePadding + self.radius) * 2;

                  self.svg = d3.select(root)
                      .append("svg")
                      .attr("viewBox", "0 0 " + width + " " + width)
                      .attr("preserveAspectRatio", "xMidYMid meet")
                      .append("g");

                  self.svg.attr("transform", "translate(" + self.width / 2 + ", " + self.radius + ")");

                  self.svg.append("g")
                      .attr("class", "slices");
                  self.svg.append("g")
                      .attr("class", "slice-titles");
                  self.svg.append("g")
                      .attr("class", "lines");
                  self.selectedSliceTitleText = self.svg.append("g")
                      .append("text")
                      .attr("text-anchor", "middle")
                      .attr("dy", "-1em");
                  self.sliceInfoText = self.svg.append("g")
                      .append("text")
                      .attr("text-anchor", "middle");
                  self.percentsText = self.svg.append("g")
                      .append("text")
                      .attr("text-anchor", "middle")
                      .attr("dy", "1em");
              },

              _hsl2Rgb : function(h, s, l) {
                  var r, g, b;

                  if (s == 0) {
                      // Achromatic:
                      r = g = b = l;
                  }
                  else {
                      function hue2rgb(p, q, t) {
                          if (t < 0) {
                              t += 1;
                          }
                          if (t > 1) {
                              t -= 1;
                          }
                          if (t < 1/6) {
                              return p + (q - p) * 6 * t;
                          }
                          if (t < 0.5) {
                              return q;
                          }
                          if (t < 2/3) {
                              return p + (q - p) * (2/3 - t) * 6;
                          }
                          return p;
                      }

                      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                      var p = 2 * l - q;
                      r = hue2rgb(p, q, h + 1/3);
                      g = hue2rgb(p, q, h);
                      b = hue2rgb(p, q, h - 1/3);
                  }

                  return "#" + [r, g, b]
                      .map(function(x) {
                          var res = Math.floor(x * 255).toString(16);
                          if (res.length == 1) {
                              res = "0" + res;
                          }

                          return res;
                      })
                      .join("");
              },

              _createValueInterpolation : function(animatedObj, value) {
                  if (value == undefined) {
                      return null;
                  }

                  animatedObj._current = animatedObj._current || value;
                  var interpolate = d3.interpolate(animatedObj._current, value);
                  animatedObj._current = interpolate(1);

                  return interpolate;
              },

              _getPercents : function(d) {
                  return 100 * d.size / this.model.slices.reduce(function(s1, s2) {
                      return s1 + s2.size;
                  }, 0);
              },

              updateSvgData : function() {
                  var self = this;

                  var pie = d3.layout.pie()
                      .sort(null)
                      .value(self._getPercents.bind(self));

                  var key = function(d) {
                      return d.data.title;
                  };

                  var arc = d3.svg.arc()
                      .outerRadius(self.radius * 0.9)
                      .innerRadius(self.radius * 0.65);

                  var outerArc = d3.svg.arc()
                      .outerRadius(self.radius * 0.95)
                      .innerRadius(self.radius * 0.95);

                  colors = d3.scale.ordinal()
                      .domain(self.model.slices.map(function(s) {
                          return s.title;
                      }))
                      .range(self.model.slices.map(function(s, i) {
                          return s.color || self._hsl2Rgb(i / self.model.slices.length, 0.9, 0.65);
                      }));

                  blurredColors = d3.scale.ordinal()
                      .domain(colors.domain())
                      .range(self.model.slices.map(function(s, i) {
                          return s.blurredColor || self._hsl2Rgb(i / self.model.slices.length, 0.9, 0.9);
                      }));

                  function aboveThresholdVisibility(d) {
                      return d.data.size > 0 ? "visible" : "hidden";
                  }

                  // Pie slices:
                  self.slices = self.svg.select(".slices").selectAll("path.slice")
                      .data(pie(self.model.slices), key);

                  self.slices.enter()
                      .insert("path")
                      .style("fill", function(d) {
                          return colors(d.data.title);
                      })
                      .attr("cursor", "pointer")
                      .attr("class", "para-pie")
                      .on('mouseover', function(d, i) {
                          self.highlightSlice(i);
                      })
                      .on('mouseout', function() {
                          self.highlightNothing();
                      })
                      .on('click', function(d, i) {
                          self.clickSlice(i);
                      });

                  self.slices
                      .transition().duration(self.animationDuration)
                      .attrTween("d", function(d) {
                          var interpolate = self._createValueInterpolation(this, d);
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              return arc(interpolate(t));
                          };
                      });

                  self.slices.exit()
                      .remove();

                  // Text labels:
                  self.sliceTitleTexts = self.svg.select(".slice-titles").selectAll("text")
                      .data(pie(self.model.slices), key)
                      .style("visibility", aboveThresholdVisibility);

                  self.sliceTitleTexts.enter()
                      .append("text")
                      .attr("dy", ".35em")
                      .style("visibility", aboveThresholdVisibility)
                      .attr("cursor", "pointer")
                      .text(function(d) {
                          return d.data.title;
                      })
                      .on('mouseover', function(d, i) {
                          self.highlightSlice(i);
                      })
                      .on('mouseout', function() {
                          self.highlightNothing();
                      })
                      .on('click', function(d, i) {
                          self.clickSlice(i);
                      });

                  function midAngle(d) {
                      return d.startAngle + (d.endAngle - d.startAngle) / 2;
                  }

                  self.sliceTitleTexts.transition().duration(self.animationDuration)
                      .attrTween("transform", function(d) {
                          var interpolate = self._createValueInterpolation(this, d);
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              var d2 = interpolate(t);
                              var pos = outerArc.centroid(d2);
                              pos[0] = self.radius * (midAngle(d2) < Math.PI ? 1 : -1);

                              return "translate(" + pos + ")";
                          };
                      })
                      .styleTween("text-anchor", function(d) {
                          var interpolate = self._createValueInterpolation(this, d);
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              var d2 = interpolate(t);

                              return midAngle(d2) < Math.PI ? "start" : "end";
                          };
                      });

                  self.sliceTitleTexts.exit()
                      .remove();

                  // Slice to text polylines:
                  var polylines = self.svg.select(".lines").selectAll("polyline")
                      .data(pie(self.model.slices), key)
                      .style("visibility", aboveThresholdVisibility);

                  polylines.enter()
                      .append("polyline")
                      .attr("class", "para-pie")
                      .style("visibility", aboveThresholdVisibility);

                  polylines.transition().duration(self.animationDuration)
                      .attrTween("points", function(d) {
                          var interpolate = self._createValueInterpolation(this, d);
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              var d2 = interpolate(t);
                              var pos = outerArc.centroid(d2);
                              pos[0] = self.radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);

                              return [arc.centroid(d2), outerArc.centroid(d2), pos];
                          };
                      });

                  polylines.exit()
                      .remove();


                  // Make sure the GUI's state is retained:
                  if (self.highlightedSliceIndex != null) {
                      self.highlightSlice(self.highlightedSliceIndex, true);
                  }
              },

              highlightSlice : function(sliceIndex, transition) {
                  var self = this;

                  self.slices
                      .style("fill", function(d, i) {
                          return i == sliceIndex ? colors(d.data.title) : blurredColors(d.data.title);
                      });

                  self.sliceTitleTexts
                      .style("fill", function(d, i) {
                          return i == sliceIndex ? "black" : "lightgray";
                      });
                  self.sliceTitleTexts[0][sliceIndex].parentNode.appendChild(self.sliceTitleTexts[0][sliceIndex])

                  self.selectedSliceTitleText.text(self.model.slices[sliceIndex].title);
                  self.sliceInfoText
                      .transition().duration(transition ? self.animationDuration : 0)
                      .tween("text", function() {
                          var slice = self.model.slices[sliceIndex];
                          var interpolate = self._createValueInterpolation(this, slice.size);
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              $(this).text(slice.textPrefix + Math.round(interpolate(t)) + slice.textSuffix);
                          };
                      });
                  self.percentsText
                      .transition().duration(transition ? self.animationDuration : 0)
                      .tween("text", function() {
                          var slice = self.model.slices[sliceIndex];
                          var interpolate = self._createValueInterpolation(this, self._getPercents(slice));
                          if (interpolate == null) {
                              return null;
                          }

                          return function(t) {
                              $(this).text(percentsFilter(interpolate(t)));
                          };
                      });

                  self.selectedSliceTitleText.style("visibility", "visible");
                  self.sliceInfoText.style("visibility", "visible");
                  self.percentsText.style("visibility", "visible");

                  self.highlightedSliceIndex = sliceIndex;
              },

              highlightNothing : function() {
                  var self = this;

                  if (self.model.slices.selected != null) {
                      self.highlightSlice(self.model.slices.selected);
                  }
                  else {
                      self.slices
                          .style("fill", function(d) {
                              return colors(d.data.title);
                          });
                      self.sliceTitleTexts
                          .style("fill", "black");
                      self.selectedSliceTitleText.style("visibility", "hidden");
                      self.sliceInfoText.style("visibility", "hidden");
                      self.percentsText.style("visibility", "hidden");
                      self.highlightedSliceIndex = null;
                  }
              },

              clickSlice : function(sliceIndex) {
                  var self = this;

                  self.model.selectSlice(sliceIndex == self.model.slices.selected ? null : sliceIndex);
              },

              sliceSelected : function(sliceIndex) {
                  var self = this;

                  if (sliceIndex != null) {
                      self.highlightSlice(sliceIndex);
                  }
                  else {
                      self.highlightNothing();
                  }
              }
          });

          var Model = Class.extend({
              init : function(scope) {
                  var self = this;

                  self._scope = scope;

                  self._scope.slices = self._scope.slices || [];
                  self._scope.slices.selected = self._scope.slices.selected || undefined;

                  // self.slices contains all of the slices in self._scope.slices.
                  // The difference between the two is while the slices order
                  // within self._scope.slices may change, it doesn't change in
                  // self.slices. Moreover, once slices are deleted from
                  // self._scope.slices, they aren't deleted from self.slices -
                  // their size changes to 0.
                  // This "mirroring" is a must, because we want the pie to
                  // have a consistent look (e.g. slices shouldn't change their
                  // position in the pie - even if they did change in
                  // self._scope.slice).
                  self.slices = angular.copy(self._scope.slices);
              },

              createListeners : function() {
                  var self = this;

                  function update() {
                      if ((self._scope.slices || []).length > 0) {
                          // Copy slices to self.slices:
                          self._scope.slices
                            .forEach(function(slice) {
                                var sliceIndex = self.slices.map(function(s) {
                                    return s.title;
                                }).indexOf(slice.title);
                                if (sliceIndex < 0) {
                                    self.slices.push(slice);
                                }
                                else {
                                    self.slices[sliceIndex] = slice;
                                }
                            });

                          // "Delete" slices which don't exit anymore:
                          self.slices
                            .forEach(function(slice) {
                                var sliceIndex = self._scope.slices.map(function(s) {
                                    return s.title;
                                }).indexOf(slice.title);
                                if (sliceIndex < 0) {
                                    slice.size = 0;
                                }
                            });

                          // Translate the selected property:
                          self.slices.selected = self._scope.slices.selected == null ?
                              self._scope.slices.selected :
                              self.slices.indexOf(self._scope.slices[self._scope.slices.selected]);

                          self.gui.updateSvgData();
                          self.selectSlice(self.slices.selected);
                      }
                  }

                  self._scope.$watchCollection(function() {
                      return self._scope.slices;
                  },
                  update,
                  true);

                  self._scope.$watch(function() {
                      return self._scope.slices.selected;
                  },
                  update);
              },

              selectSlice : function(sliceIndex) {
                  var self = this;

                  self.slices.selected = sliceIndex;

                  // Translate the selected property:
                  self._scope.slices.selected = sliceIndex == null ?
                      sliceIndex :
                      self._scope.slices.indexOf(self.slices[sliceIndex]);

                  self.gui.sliceSelected(sliceIndex);
              }
          });

          var gui = new Gui();
          var model = new Model(scope);
          gui.model = model;
          model.gui = gui;
          gui.createSvg(element[0]);
          model.createListeners();
      }
  };
});