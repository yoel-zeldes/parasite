describe('ParasiteURL service', function () {
    var appNames = ['parasite', 'devcenter'];

    var dev;
    var $provide;
    var $location;
    var ParasiteURL;
    var Applications;
    var $rootScope;

    beforeEach(angular.mock.module('core.applications', 'core.plugins', 'core.dev', 'core.url', 'parasite.plugins', ['ApplicationsProvider', 'dev', function(ApplicationsProvider, d) {
        dev = d;

        var mockAppClass = ApplicationsProvider.Application.extend({
            getNavigationModel : function(update) {
                return null;
            }
        });
        appNames.forEach(function(appName) {
            var mockApp = new mockAppClass(appName,
                [
                    {
                        pluginId    : 'parasite.thumbnails',
                        repr        : ''
                    }
                ],
                [
                    {
                        pluginId    : 'parasite.showcase',
                        repr        : ''
                    }
                ])
            ApplicationsProvider.register(mockApp)
        });
    }]));
    beforeEach(angular.mock.inject(['$injector', '$rootScope', function($injector, rootScope) {
        $location = $injector.get('$location');
        Applications = $injector.get('Applications');
        ParasiteURL = $injector.get('ParasiteURL');

        $rootScope = rootScope;
    }]));

    if (dev) {
        it("test url structure", function () {
            var appName = 'app name';
            var navigationNodeId = '/a/b/c';

            ParasiteURL.applicationName(appName);
            ParasiteURL.navigationNodeId(navigationNodeId);
            expect($location.path()).toBe('/app/' + appName + navigationNodeId);
        });

        it("set and get valid application names", function () {
            appNames.forEach(function(appName) {
                $rootScope.$apply(function() {
                    ParasiteURL.applicationName(appName);
                });
                expect(ParasiteURL.applicationName()).toBe(appName);
                expect(Applications.currentApplication().name).toBe(appName);
            });
        });

        it("set invalid application name", function () {
            $rootScope.$apply(function() {
                ParasiteURL.applicationName("app doesn't exist");
            });
            expect(ParasiteURL.applicationName()).toBe('parasite');
            $rootScope.$apply(function() {
                ParasiteURL.applicationName("devcenter");
            });
            $rootScope.$apply(function() {
                ParasiteURL.applicationName("app doesn't exist");
            });
            expect(ParasiteURL.applicationName()).toBe('parasite');
        });

        it("should update url when current application changes", function () {
            var app = Applications.applications()[0];
            $rootScope.$digest();
            $rootScope.$apply(function() {
                Applications.currentApplication(app);
            });
            expect(ParasiteURL.applicationName()).toBe(app.name);
        });

        it("should reset navigation node id when app changes", function () {
            var app = Applications.applications()[0];
            $rootScope.$digest();
            $rootScope.$apply(function() {
                Applications.currentApplication(app);
            });
            expect(ParasiteURL.navigationNodeId()).toBe("");
        });
    }
    else {
        it("test url structure", function () {
            var navigationNodeId = '/a/b/c';

            ParasiteURL.navigationNodeId(navigationNodeId);
            expect($location.path()).toBe(navigationNodeId);
        });
    }

    it("test search api", function () {
        Applications.currentApplication(Applications.applications()[0]);

        var search = {filter : 'a', operator : '=', value : 'b'};
        ParasiteURL.search(search);
        expect(angular.equals(ParasiteURL.search(), [search])).toBeTruthy();

        var search = [{filter : 'a', operator : '=', value : 'b'}, {filter : 'c', operator : '!=', value : 'd'}];
        ParasiteURL.search(search);
        expect(angular.equals(ParasiteURL.search(), search)).toBeTruthy();
    });

    it("test sort api", function () {
        Applications.currentApplication(Applications.applications()[0]);

        var field = 'field';
        var isAscending = true;
        ParasiteURL.sort(field, isAscending);
        expect(angular.equals(ParasiteURL.sort(), {sort : field, isAscending : isAscending})).toBeTruthy();

        ParasiteURL.sort(ParasiteURL.sort());
        expect(angular.equals(ParasiteURL.sort(), {sort : field, isAscending : isAscending})).toBeTruthy();
    });
});