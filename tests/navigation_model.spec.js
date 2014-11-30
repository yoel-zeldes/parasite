describe('ParasiteURL service', function () {
    var NavigationModel;
    var $rootScope;
    var $q;

    beforeEach(angular.mock.module('core.navigation'));
    beforeEach(angular.mock.inject(['$injector', '$rootScope', '$q', function($injector, rootScope, q) {
        NavigationModel = $injector.get('NavigationModel');
        $rootScope = rootScope;
        $q = q;
    }]));

    it("test initialization", function () {
        var name = 'name';
        var item = 1;
        var numOfKids = 0;
        var parent = null;

        var n = new NavigationModel.NavigationNode(name, item, numOfKids, parent);
        expect(n.name).toBe(name);
        expect(n.item).toBe(item);
        expect(n.numOfKids).toBe(numOfKids);
        expect(n.parent).toBe(parent);
        expect(n.kids).toEqual([]);

        var kids = [n];
        var n = new NavigationModel.NavigationNode(name, item, kids, parent);
        expect(n.name).toBe(name);
        expect(n.item).toBe(item);
        expect(n.numOfKids).toBe(kids.length);
        expect(n.parent).toBe(parent);
        expect(n.kids).toBe(kids);
        expect(n.kids[0].parent).toBe(n);

        var son = new NavigationModel.NavigationNode(name, item, kids, n);
        expect(son.id).toBe("/" + name);

        expect(function() {
            new NavigationModel.NavigationNode(name, item, kids, 1);
        }).toThrow();

        var kids = [1];
        expect(function() {
            new NavigationModel.NavigationNode(name, item, kids, parent);
        }).toThrow();

        expect(function() {
            n.update([n, n]);
        }).toThrow();
    });

    it("test update kids", function () {
        var name = 'name';
        var item = 1;
        var numOfKids = 0;
        var parent = null;
        var kid = new NavigationModel.NavigationNode(name, item, numOfKids);

        // Update with an array:
        var n = new NavigationModel.NavigationNode(name, item, numOfKids, parent);
        n.update([kid]);
        expect(n.kids).toEqual([kid]);
        expect(kid.id).toBe("/" + kid.name);
        expect(n.numOfKids).toBe(1);

        // Update with a single element:
        var n = new NavigationModel.NavigationNode(name, item, numOfKids, parent);
        n.update(kid);
        expect(n.kids).toEqual([kid]);

        // Update with a promise:
        var n = new NavigationModel.NavigationNode(name, item, numOfKids, parent);
        var deferred = $q.defer();
        n.update(deferred.promise);
        $rootScope.$apply(function() {
            deferred.resolve([kid]);
        });
        expect(n.kids).toEqual([kid]);

        // Try to update with illegal values:
        expect(function() {
            n.update([1]);
        }).toThrow();
        expect(function() {
            n.update(1);
        }).toThrow();
        expect(function() {
            n.update([n, n]);
        }).toThrow();
        expect(function() {
            n.update([n, n]);
        }).toThrow();

        // Update and delete:
        var n = new NavigationModel.NavigationNode(name, item, [n], parent);
        n.update([])
        expect(n.kids).toEqual([]);

        // Update some of the kids:
        var name2 = 'name2';
        var name3 = 'name3';
        var kids = [
            new NavigationModel.NavigationNode(name, item),
            new NavigationModel.NavigationNode(name2, item)
        ];
        var n = new NavigationModel.NavigationNode(name, item, kids, parent);
        var kid = new NavigationModel.NavigationNode(name3, item);
        n.update([kid], 0);
        expect(n.kids.length).toEqual(2);
        expect(n.kids[0].name).toBe(name3);
        expect(n.kids[1].name).toBe(name2);
    });

    it("test find", function () {
        var level1 = 'level1';
        var level2_first = 'level2_first';
        var level2_second = 'level2_second';
        var level3 = 'level3';
        var n1 = new NavigationModel.NavigationNode(level1, 1);
        var n11 = new NavigationModel.NavigationNode(level2_first, 1);
        var n12 = new NavigationModel.NavigationNode(level2_second, 1);
        var n121 = new NavigationModel.NavigationNode(level3, 1);

        n1.update([n11, n12]);
        n12.update(n121);

        expect(n1.find('/' + level2_second + '/' + level3)).toBe(n121);
        expect(n1.find('/' + level2_first + '/' + level3)).toBe(null);
    });

    it("test findByExpanding", function () {
        var name = 'name';
        var name2 = 'name2';
        var item = 1;
        var numOfKids = 2;
        var kids = [
            new NavigationModel.NavigationNode(name, 1),
            new NavigationModel.NavigationNode(name2, 2)
        ];

        var mockApp = {
            getKids : function(node, startIndex, endIndex) {
                return kids;
            }
        };
        var n = new NavigationModel.NavigationNode(name, item, numOfKids);
        $rootScope.$apply(function() {
            n.findByExpanding('/' + name2, mockApp).then(function(res) {
                expect(kids.indexOf(res)).not.toBeLessThan(0);
            });
        });
    });
});