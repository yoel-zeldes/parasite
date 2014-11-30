angular.module('core.applications', []);
angular.module('core.plugins', []);
angular.module('core.navigation', ['core.applications']);
angular.module('core.search', []);
angular.module('core.url', ['core.applications', 'core.plugins', 'core.navigation', 'core.search']);
angular.module('core.login', ['ui.bootstrap', 'core.applications', 'core.dev']);

angular.module('core.dev', ['core.applications']);

angular.module('core', ['core.dev', 'core.applications', 'core.plugins', 'core.navigation', 'core.search', 'core.url', 'core.login']);