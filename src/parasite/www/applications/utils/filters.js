angular.module('utils')
.filter('parseDate', function(dateFilter) {
	return function(time) {
		if (time) {
			return dateFilter(time * 1000,'dd/MM/yyyy h:mma');
		}
		
		return "-";
	};
})


.filter('roundFloat', function() {
	return function(f) {
		return Math.floor(f * 100) / 100;
	};
})


.filter('percents', function(roundFloatFilter) {
	return function(f) {
		return roundFloatFilter(f) + '%';
	};
})


.filter('titleCase', function() {
	return function(f) {
        return (f || '').split(' ')
            .map(function(word) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
	};
});