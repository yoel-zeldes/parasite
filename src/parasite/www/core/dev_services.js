angular.module('core.dev')
    .constant('mock', true)
    .run(function($rootScope, Applications) {
        $rootScope.$watch(function() {
            return Applications.currentApplication();
        },
        function(app, oldApp) {
            if (app && oldApp == undefined && app.name != 'devcenter') {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = 'http://localhost:8008/livereload.js?snipver=1';
                $('body').append(script);
            }
        });

        $(function() {
            var injector = angular.element('html').injector();
            if (injector != undefined) {
                window.inject = injector.get;
            }
        });
    });