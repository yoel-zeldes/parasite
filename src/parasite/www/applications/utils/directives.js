angular.module('utils')
.directive('paraStretch', function($interval) {
	return {
		restrict	: 'A',
        require     : '^paraPluginCanvas',
		scope		: false,
		link: function(scope, element, attrs, paraPluginCanvasCtrl) {
			function watchHeight() {
                var heightDiff = paraPluginCanvasCtrl.availableHeight();
				if (heightDiff != 0) {
					$(element).height($(element).height() + heightDiff);
				}
			}

			var cancelInterval = $interval(watchHeight, 250);
            scope.$on('$destroy', function() {
                $interval.cancel(cancelInterval);
            });
		}
	};
})


.directive('paraScrollbar', function() {
	function makeScrollable(selection) {
		var track, button,
			hideTimeout = null,
            dragging = false,
			elem = selection.node(),
			dragbehavior = d3.behavior.drag()
				.on('dragstart', function() {
                    dragging = true;
                    cancelDeferredHide();
                })
				.on('drag', function() {
                    elem.scrollTop += d3.event.dy * (elem.scrollHeight / elem.offsetHeight);
                })
				.on('dragend', function(e) {
                    dragging = false;
                    deferHide();
                });

		selection.on('scroll.d3-scroll', scroll);
		track = selection.append('div')
            .attr('class', 'd3-scroll-track');
        button = track.append('div')
            .attr('class', 'd3-scroll-button')
            .call(dragbehavior);

		function show() {
			track.style('display', 'block')
				.style('opacity', 1);
		}

		function hide() {
			track
				.style('opacity', 1)
				.transition()
				.style('opacity', 0)
				.each('end', function() {
					track.style('display', 'none');
				});
		}

        function deferHide() {
            hideTimeout = setTimeout(hide, 1000);
        }

        function cancelDeferredHide() {
            if (hideTimeout != null) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        }

		function scroll() {
            cancelDeferredHide();
			show();
			track.style({
				top: this.scrollTop + 'px', height: this.offsetHeight + 'px'
			});
            button
                .style({
                    height: Math.max((this.offsetHeight * this.offsetHeight) / this.scrollHeight, 30) + 'px',
                })
                .transition()
                .ease("linear")
                .duration(dragging ? 0 : 100)
                .style({
                    top: this.offsetHeight * (this.scrollTop / this.scrollHeight) + 'px'
                });

            if (!dragging) {
                deferHide();
            }
		}
	}

	return {
		restrict	: 'A',
		link        : function(scope, element, attrs) {
            element.addClass("para-scrollbar");
            d3.select(element[0]).call(makeScrollable);
        }
	};
})


.directive('paraTooltip', function() {
	return {
		restrict	: 'A',
		link: function(scope, element, attrs) {
			scope.$watch(function() {
				return attrs.paraTooltip;
			},
			function(tooltip) {
				$(element).tooltip('destroy');
				$(element).tooltip({title : attrs.paraTooltip});
			});
		}
	};
})


.directive('paraMultiSelection', function() {
	return {
		restrict	: 'AE',
		scope		: true,
		link: function(scope, element, attrs) {
			var selectSlots = [];
			masterSelect = {
				checked			: false,
				indeterminate	: false
			};
			
			scope.masterSelectChecked = function(checked) {
				if (checked == undefined) {
					return masterSelect.checked;
				}
				
				masterSelect.checked = checked;
				for (var i = 0; i < selectSlots.length; ++i) {
					selectSlots[i].checked = checked;
				}
			};
			
			scope.masterSelectIndeterminate = function(indeterminate) {
				if (indeterminate == undefined) {
					return masterSelect.indeterminate;
				}
				
				masterSelect.indeterminate = indeterminate;
			};
			
			scope.addSelectSlot = function() {
				var selectSlot = ({
					checked	:false
				});
				selectSlots.push(selectSlot);
				
				return selectSlot;
			}
			
			scope.removeSelectSlot = function(selectSlot) {
				selectSlots.pop(selectSlots.indexOf(selectSlot));
			}
			
			scope.getSelectedIndices = function() {
				var res = [];
				for (var i = 0; i < selectSlots.length; ++i) {
					if (selectSlots[i].checked) {
						res.push(i);
					}
				}
				
				return res;
			}
			
			scope.addSelectSlot = function() {
				var selectSlot = ({
					id		: selectSlots.length,
					checked	:false
				});
				selectSlots.push(selectSlot);
				
				return selectSlot;
			}

			
			scope.$watch(function() {
				return selectSlots;
			},
			function() {
				var counter = 0;
				for (var i = 0; i < selectSlots.length; ++i) {
					if (selectSlots[i].checked) {
						counter++;
					}
				}
				
				if (counter == 0) {
					scope.masterSelectIndeterminate(false);
					scope.masterSelectChecked(false);
				}
				else if (counter == selectSlots.length) {
					scope.masterSelectIndeterminate(false);
					scope.masterSelectChecked(true);
				}
				else {
					scope.masterSelectIndeterminate(true);
					scope.masterSelectChecked(null);
				}
			},
			true);
		}
	};
})


//TODO: use "require"
.directive('paraMasterSelect', function() {
	return {
		restrict	: 'E',
		transclude	: true,
		replace		: true,
		scope		: true,
		template	:
			'<input type="checkbox" ng-model="checked" />',
		link: function(scope, element, attrs) {
			scope.$watch(function() {
				return scope.checked;
			},
			function() {
				scope.masterSelectChecked(scope.checked);
				scope.masterSelectIndeterminate(element[0].indeterminate);
			});
			
			scope.$watch(function() {
				return [scope.masterSelectChecked(), scope.masterSelectIndeterminate()];
			}, function(state) {
				scope.checked = state[0];
				element[0].indeterminate = state[1];
			},
			true);
		}
	};
})


//TODO: use "require"
.directive('paraSelect', function() {
	return {
		restrict	: 'E',
		transclude	: true,
		replace		: true,
		scope		: true,
		template	:
			'<input type="checkbox" ng-init="selectSlot = addSelectSlot()" ng-model="selectSlot.checked" />',
		link: function(scope, element, attrs) {
			scope.$on("$destroy", function(event) {
				scope.removeSelectSlot(scope.selectSlot);
			});
		}
	};
})


.directive('paraToggleButton', function() {
	return {
		restrict	: 'E',
		transclude	: true,
		replace		: true,
		scope		: {"paraState" : "="},
		template	:
			'<button type="button" \
					class="btn" \
					ng-click=";toggle();"> \
				<div ng-transclude> \
				</div> \
			</button>',
		link: function(scope, element, attrs) {
			element = $(element);
			scope.toggle = function() {
				scope.paraState.state = !scope.paraState.state;
			};
			
			scope.$watch(function() {
				return scope.paraState.state;
			},
			function(state) {
				if (state != element.hasClass('active')) {
					element.button('toggle');
				}
			});
		}
	};
})


.directive('paraPrettyToggle', ['$parse', function($parse) {
  return {
      restrict: 'E',
      require:'ngModel',
      replace: true,
      transclude: true,
      scope: {},
      template:
          '<div class="para-pretty-toggle" \
                ng-mouseover=";highlight(true);" \
                ng-mouseleave=";highlight(active);" \
                ng-click=";toggle();"\
                ng-transclude> \
          </div>',
      link : function(scope, element, attrs, ngModel) {
          scope.active = false;
          var activatedGetter = $parse(attrs.activated);

          scope.highlight = function(active) {
              if (active) {
                  element.addClass("active");
              }
              else {
                  element.removeClass("active");
              }
          };

          scope.toggle = function() {
              scope.active = !scope.active;
              ngModel.$setViewValue(scope.active);
          };

          ngModel.$render = function() {
              scope.active = ngModel.$modelValue;
              scope.highlight(scope.active);
          };

          scope.$watch(function() {
              return activatedGetter(scope.$parent);
          },
          function(activated) {
              scope.highlight(activated ? scope.active : false);
          });
      }
  };
}])


.directive('paraLoadingButton', function($parse, $interval) {
	return {
		restrict	: 'A',
		link: function(scope, element, attrs) {
			var button = $(element);
			var loadingGetter = $parse(attrs.paraLoadingButton);
			var icon = attrs.icon;
			var originalHtml;
			var stopAnimationIntervalId = undefined;
			
			scope.$watch(function() {
				return loadingGetter(scope);
			},
			function(loading) {
				if (!loading || stopAnimationIntervalId != undefined) {
					return;
				}
				
				var originalWidth = button.width();
				var originalHeight = button.height();
				originalHtml = button.html();
				button.html('<i class="' + icon + ' icon-spin"></i>');
				if (originalWidth >= 0) {
					button.width(originalWidth);
				}
				if (originalHeight >= 0) {
					button.height(originalHeight);
				}
				
				stopAnimationIntervalId = $interval(function() {
					if (!loadingGetter(scope)) {
						button.html(originalHtml);
						$interval.cancel(stopAnimationIntervalId);
						stopAnimationIntervalId = undefined;
					}
				},
				1000);
			});
		}
	};
})


.directive('paraPagination', function() {
	return {
		restrict	: 'E',
		replace		: true,
		scope		: {
			'window'	: '@',
			'pages'		: '@',
			'current'	: '='
		},
		template	:
			'<div class="pagination pagination-centered" ng-if="pages > 1"> \
				<ul> \
					<li ng-class="pageNumber() == 0 ? &quot;disabled&quot; : &quot;&quot;"> \
						<a href="#" ng-click="pageNumber(pageNumber() - 1)">«</a> \
					</li> \
					\
					<li ng-repeat="i in [0,1,2,3,4,5,6,7,8,9,10].slice(0, currentWindow)" \
							ng-class="pageNumber() == _firstPageNumber() + i ? &quot;active&quot; : &quot;&quot;" \
			 				ng-click="pageNumber(_firstPageNumber() + i)"> \
						<a href="#"> \
							{{ 1 + _firstPageNumber() + i }} \
						</a> \
					</li> \
					\
					<li ng-class="pageNumber() == pages - 1 ? &quot;disabled&quot; : &quot;&quot;"> \
						<a href="#" ng-click="pageNumber(pageNumber() + 1)">»</a> \
					</li> \
				</ul> \
			</div>',
		link: function(scope, element, attrs) {
			scope.pageNumber = function(n) {
				if (n == undefined) {
					return scope.current.page;
				}
				
				if (n < 0 || n >= scope.pages) {
					return;
				}
				
				scope.current.page = n;
			};
			
			scope._firstPageNumber = function() {
				return Math.min(Math.max(scope.pageNumber() - Math.floor(scope.currentWindow / 2), 0), scope.pages - scope.currentWindow);
			};
			
			scope.$watch(function() {
				return [scope.pages, scope.window];
			},
			function() {
				scope.currentWindow = Math.min(scope.window, scope.pages);
			},
            true);
		}
	};
})


.directive('paraFileModal', function() {
	return {
		restrict	: 'E',
		transclude	: true,
		replace		: true,
		scope		: {
			title	: '@title',
			path	: '@path'
		},
		template	:
			'<div class="modal hide fade" tabindex="-1" \
				role="dialog" aria-labelledby="modal-header-text" \
				aria-hidden="true"> \
				<div class="modal-header"> \
					<button type="button" class="close" data-dismiss="modal" \
						aria-hidden="true">×</button> \
					<h3 id="modal-header-text"> \
						{{ title }} \
						<small style="word-wrap: break-word">{{ path }}</small> \
					</h3> \
				</div> \
				<div class="modal-body"> \
					<p ng-transclude/> \
				</div> \
				<div class="modal-footer"> \
					<button class="btn" data-dismiss="modal" aria-hidden="true">Close</button> \
				</div> \
			</div>'
	};
})


.directive('paraCrop', function() {
	return {
		restrict	: 'E',
		replace		: true,
		scope		: {
            text    : '@text',
			limit	: '@limit'
		},
		template	:
			'<span para-tooltip="{{ text.length > limit ? text : \'\' }}"> \
                {{ text.substr(0, limit) }}<span ng-if="text.length > limit">...</span> \
            </span>'
	};
});