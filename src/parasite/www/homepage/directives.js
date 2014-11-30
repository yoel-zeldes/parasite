angular.module('parasiteApp')
.directive('paraPluginCanvasContainer', function($interval, $timeout, Plugins) {
	return {
		restrict	: 'A',
        priority    : 1000000,  // The combination of high priority and $timeout below make sure that the kendo-splitter directive is already applied when we start executing.
		link: function(scope, element, attrs) {
            var cancelInterval = $interval(
                function watchHeight() {
                    var height = element.height();
                    var newHeight = window.innerHeight - element.position().top;
                    if (height != newHeight) {
                        element.height(newHeight);
                        element.trigger('resize');
                    }
                },
                250);
            scope.$on('$destroy', function() {
                $interval.cancel(cancelInterval);
            });

            $timeout(function() {
                var lastPluginConf = null;
                var splitter = element.data('kendoSplitter');
                splitter.bind('collapse', function() {
                    lastPluginConf = Plugins.currentContentPluginConf();
                    Plugins.currentContentPluginConf(null);
                });
                splitter.bind('expand', function() {
                    Plugins.currentContentPluginConf(lastPluginConf);
                });

                scope.$watch(attrs.showContent,
                    function(showContent) {
                        splitter[showContent ? 'expand' : 'collapse']('.content-plugin');
                        element.children('.k-splitbar')[showContent ? 'removeClass' : 'addClass']('hidden');
                    });
            }, 0);
        }
	};
})


.directive('paraPluginCanvas', function() {
	return {
		restrict	: 'E',
		transclude	: true,
		replace		: false,
		template	:
          '<div style="overflow: hidden; min-height: 200px" ng-transclude></div>',   // We need min-height so the plugin-loading-spinner will be visible
		controller  : function($element) {
            this.availableHeight = function() {
                var children = $element.children();
				var last = $(children[children.length - 1]);
                var pluginCanvasActualHeight = last.position().top + last.height() - $element.position().top;

                return $element.parent().height() - pluginCanvasActualHeight;
            };
		}
	};
});