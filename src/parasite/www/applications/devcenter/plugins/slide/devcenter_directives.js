angular.module('devcenter.plugins')
.directive('devA', function(Navigation) {
    return {
        restrict	: 'E',
        replace     : true,
        transclude  : true,
        scope       : {
            slide    : '@devRef'
        },
        template	:
            '<a href="#" ng-click="goToSlide(slide)" ng-transclude></a>',
        link        : function(scope) {
            scope.goToSlide = function(name) {
                if (name.indexOf('..') == 0) {
                    // Relative path:
                    var id = Navigation.currentNavigationNode().id;
                    while (name.indexOf('..') == 0) {
                        id = id.substr(0, id.lastIndexOf('/'));
                        name = name.replace(/\.\.\/?/, '');
                    }
                    name = id + '/' + name;
                }

                if (name[0] != "/") {
                    // Absolute path:
                    var id = Navigation.currentNavigationNode().id;
                    if (id[id.length - 1] != '/') {
                        id += '/';
                    }
                    name = id + name;
                }

                var node = Navigation.currentNavigationModel().find(name);
                if (node == null) {
                    throw new Error("slide doesn't exist");
                }
                Navigation.currentNavigationNode(node);
            };
        }
    };
})


.directive('devToc', function() {
	return {
		restrict	: 'E',
        replace     : false,
        transclude  : true,
        scope       : true,
		template	:
			'<span> \
			    <p> \
			        {{ text() }} \
                </p> \
                <ol ng-transclude> \
                </ol> \
            </span>',
        controller: function($scope, $attrs) {
            $scope.text = function() {
                return $attrs.header;
            };
        }
	};
})


.directive('devTocSlide', function() {
	return {
		restrict	: 'E',
        replace     : false,
        transclude  : true,
        scope       : true,
        require     : '^devToc',
		template	:
			'<li> \
                <dev-a dev-ref="{{ slideName }}">{{ slideName }}:</dev-a> \
                <span ng-transclude /> \
            </li>',
        link        : function(scope, element, attrs) {
            scope.slideName = attrs.link;
        }
	};
});