describe('login service', function () {
    var login;
    var Applications;
    var $rootScope;
    var $q;
    var $modal;

    beforeEach(angular.mock.module('core.login', 'core.applications', function($provide) {
        $provide.constant('dev', false);
    }));
    beforeEach(angular.mock.inject(['$injector', '$rootScope', '$q', '$modal', function($injector, rootScope, q, modal) {
        login = $injector.get('login');
        Applications = $injector.get('Applications');
        $rootScope = rootScope;
        $q = q;
        $modal = modal
    }]));

    it("user is initially undefined", function () {
        expect(login.user()).toBeUndefined();
    });

    it("user set and get work with simple values", function () {
        var userName = "some user name";
        login.user(userName);
        expect(login.user()).toBe(userName);
    });

    it("user get works with promises", function () {
        var userName = 'someone';
        spyOn($modal, 'open').and.returnValue({ result  : $q.when(userName) });
        $rootScope.$apply(function() {
            login.user(true).then(function(u) {
                expect(u).toBe(userName);
                expect($modal.open.calls.count()).toBe(1);

                // Tests again the same thing (this time, the prompt shouldn't get called):
                login.user(true).then(function(u) {
                    expect(u).toBe(userName);
                    expect($modal.open.calls.count()).toBe(1);
                });
            });
        });
    });

    it("login is/isn't supported", function () {
        var isLoginSupported = false;
        Applications.currentApplication({
            isLoginSupported : function() {
                return isLoginSupported;
            }
        });
        expect(login.isLoginSupported()).toBeFalsy();
        isLoginSupported = true;
        expect(login.isLoginSupported()).toBeTruthy();
    });
});