angular.module('core.search')
.service('Search', function($q, $rootScope, Applications, Navigation) {
	var self = this;

    var queries = [];
    var sort = {
        sort       : null,
        isAscending : null
    };

    function updateNavigationModel() {
        Navigation.currentNavigationModel(null);
		$q.when(Applications.currentApplication().getNavigationModel(true))
		.then(function(model) {
			Navigation.currentNavigationModel(model);
		});
    }

    function doSearch(searchQueries) {
        if (searchQueries === null) {
            searchQueries = [];
		}

        if (! (searchQueries instanceof Array)) {
            searchQueries = [searchQueries];
        }

        searchQueries.forEach(function(q) {
            if (q.filter == undefined || q.operator == undefined || q.value == undefined) {
                throw new Error("search queries must contain search objects (containing filter, operator and value attributes)");
            }
        });

        queries = searchQueries;
    }

	this.search = function(searchQueries) {
        /*
        If called with no argument, return the current search query.
        A search query is an Array of objects. Each object contains
        the attributes filter, operator and value. To read more about it, refer to
        http://127.0.0.1:8000/app/devcenter/creating%20an%20app/server%20side/search/overview.

        If called with an Array (each item is a query object), set the search
        accordingly, and perform the search operation. The search operation
        is performed by making the current application recalculate the
        navigation model (so it's up to the application to consider
        Search.search() in order to construct the right navigation model - one
        which contains only items which answer the search queries).
         */
		if (searchQueries === undefined) {
            return angular.copy(queries);
		}
		doSearch(searchQueries);

        updateNavigationModel();
	};

    function doSort(field, isAscending) {
        if (field === null) {
            isAscending = null;
        }
        else if (isAscending === undefined) {
            isAscending = field.isAscending;
            field = field.sort;
        }

        sort.sort = field;
        sort.isAscending = isAscending;
    }

    this.sort = function(field, isAscending) {
        /*
        If called with no arguments, return the current sort.
        The sort is an object containing sort string field, and
        isAscending boolean field. Together, they imply to the application
        that the navigation model should be sorted according to the sort
        field in an ascending / descending order (decided by isAscending).

        If called with arguments, set the sort accordingly, and perform
        the sort operation. The sort operation is performed by making
        the current application recalculate the navigation model (so it's
        up to the application to consider Search.sort() in order to
        construct the right navigation model - one whose items are sorted
        according to the sort parameters).
         */
        if (field === undefined) {
            return angular.copy(sort);
        }
        doSort(field, isAscending);

        updateNavigationModel();
    };


    $rootScope.$watch(function() {
        return Applications.currentApplication();
    },
    function(newApp, oldApp) {
        if (oldApp != null) {
            doSearch([]);
            doSort(null);
            updateNavigationModel();
        }
    });
});