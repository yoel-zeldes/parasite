angular.module('parasiteApp')
.controller('SearchCtrl', function($scope, $resource, $timeout, $q, Search, Applications) {
	$scope.searchInput = [];
    $scope.searchSupported = true;

	var searchResource = undefined;
	$scope.$watch(function() {
		return Applications.currentApplication();
	},
	function(app) {
		if (app == undefined) {
			return;
		}

		searchResource = $resource('/' + Applications.currentApplication().name + '/search_options?q=:q', {}, {
			search		: {method : 'GET'}
		});

        $scope.searchSupported = true;
        searchResource.search(function(res) {
            if (res.options == undefined) {
                $scope.searchSupported = false;
            }
        })
	});

    var searchOptions= [];
    function updateSearchOptions(q) {
        var deferred = $q.defer();
        var selected = select2SearchOptions.select2("data").map(function(d) {
            return d.id;
        });

        searchResource.search({q : q, selected: selected},
            function(res) {
                searchOptions = res.options;
                for (var i = 0; i < searchOptions.length; ++i) {
                    searchOptions[i].valid = searchOptions[i].id.value != null;
                    searchOptions[i].id = JSON.stringify(searchOptions[i].id);
                }
                deferred.resolve(searchOptions);
            });
        return deferred.promise;
    }

    function termToSearch(term) {
        var filter = null;
        var operator = null;
        var value = null;
        var valid = false;
        var match = termInQuery.match(/(.*)(<|<=|=|>=|>)(.*)/);
        if (match == null) {
            filter = termInQuery;
        }
        else {
            filter = match[1];
            operator = match[2];
            value = match[3].trim();
            if (value.length == 0) {
                value = null;
            }
            else {
                valid = true;
            }
        }
        return {
            text    : termInQuery,
            id      : JSON.stringify({
                filter      : filter.trim(),
                operator    : operator,
                value       : value ? value.trim() : null
            }),
            valid   : valid
        };
    }

    var termInQuery = "";
    $scope.select2Options = {
        query : function(options) {
            termInQuery = options.term;
            searchOptions = [termToSearch(termInQuery)];
            options.callback({results : searchOptions});
            updateSearchOptions(options.term).then(function(searchOptions) {
                if (options.term == termInQuery) {
                    options.callback({results : searchOptions});
                }
            })
        },

        openOnEnter : false,

        tokenizer : function(input, selection, selectCallback, opts) {
            var last = input.charAt(input.length - 1);
            if (last == ',' || last == ' ') {
                input = input.substr(0, input.length - 1);
                var searchOptionItem = searchOptions.filter(function(item) {
                    return item.text == input;
                })[0];
                if (searchOptionItem != undefined) {
                    selectCallback(searchOptionItem);
                    select2SearchOptions.select2('open');
                }
            }
        }
    };

	var select2SearchOptions = $('#select2-search-options');
	var select2Input = undefined;

	select2SearchOptions.on('select2-selecting', function(e) {
		var newSearchOptionItem = searchOptions.filter(function(item) {
            return item.id == e.object.id;
        })[0];

		if (newSearchOptionItem == undefined || !newSearchOptionItem.valid) {
			select2Input.val(e.object.text).trigger('input');
			e.preventDefault();
		}
	});

    function copySearchToInput() {
        var searchQueries = Search.search().map(function(s) {
            return {id : s, text : [s.filter, s.operator, s.value].join(" ")};
        });
        select2SearchOptions.select2("data", searchQueries);
        $scope.searchInput = searchQueries;
    }

    var searching = false;
    $scope.searching = function(s) {
        if (s == undefined) {
            return searching;
        }

        searching = s;
    }

	$scope.search = function() {
        var search = $scope.searchInput
            .map(function(searchOption) {
                return typeof(searchOption.id) == "string" ?  JSON.parse(searchOption.id) : searchOption.id;
            }
        );
        $scope.searching(true);
		Search.search(search);
        $q.when(Applications.currentApplication().getNavigationModel(false))
            .then(function(model) {
                $scope.searching(false);
                // We need to copySearchToInput here too (in addition to the
                // $watch below) for situations where getNavigationModel
                // has changed the Search.search() back to what it was prior
                // to what the user has typed. In such situation, the $watch
                // won't be triggered.
                copySearchToInput();
            });
	};

    function initialize() {
        select2Input = select2SearchOptions.select2('container').find('input.select2-input');
        if (select2Input.length == 0) {
            // select2 hasn't kicked in yet. Try again letter:
            $timeout(initialize, 10);
            return;
        }

        select2Input.keydown(function(e) {
            if (String.fromCharCode(e.which) === '\t') {
                e.preventDefault();
                select2SearchOptions.select2('open');
            }
        });
        select2Input.focus();

        $scope.$watch(function() {
            return Search.search();
        },
        copySearchToInput,
        true);
    }
    initialize();
});