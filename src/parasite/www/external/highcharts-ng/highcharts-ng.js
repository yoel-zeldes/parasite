'use strict';
angular.module('highcharts-ng', []).directive('highchart', function () {
  var indexOf = function (arr, find, i) {
    if (i === undefined)
      i = 0;
    if (i < 0)
      i += arr.length;
    if (i < 0)
      i = 0;
    for (var n = arr.length; i < n; i++)
      if (i in arr && arr[i] === find)
        return i;
    return -1;
  };
  function prependMethod(obj, method, func) {
    var original = obj[method];
    obj[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      func.apply(this, args);
      if (original) {
        return original.apply(this, args);
      } else {
        return;
      }
    };
  }
  function deepExtend(destination, source) {
    for (var property in source) {
      if (source[property] && source[property].constructor && source[property].constructor === Object) {
        destination[property] = destination[property] || {};
        deepExtend(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }
    return destination;
  }
  var seriesId = 0;
  var ensureIds = function (series) {
    var changed = false;
    angular.forEach(series, function (s) {
      if (!angular.isDefined(s.id)) {
        s.id = 'series-' + seriesId++;
        changed = true;
      }
    });
    return changed;
  };
  var axisNames = [
      'xAxis',
      'yAxis'
    ];
  var getMergedOptions = function (scope, element, config) {
    var mergedOptions = {};
    var defaultOptions = {
        chart: { events: {} },
        title: {},
        subtitle: {},
        series: [],
        credits: {},
        plotOptions: {},
        navigator: { enabled: false }
      };
    if (config.options) {
      mergedOptions = deepExtend(defaultOptions, config.options);
    } else {
      mergedOptions = defaultOptions;
    }
    mergedOptions.chart.renderTo = element[0];
    angular.forEach(axisNames, function (axisName) {
      if (config[axisName]) {
        prependMethod(mergedOptions.chart.events, 'selection', function (e) {
          var thisChart = this;
          if (e[axisName]) {
            scope.$apply(function () {
              scope.config[axisName].currentMin = e[axisName][0].min;
              scope.config[axisName].currentMax = e[axisName][0].max;
            });
          } else {
            scope.$apply(function () {
              scope.config[axisName].currentMin = thisChart[axisName][0].dataMin;
              scope.config[axisName].currentMax = thisChart[axisName][0].dataMax;
            });
          }
        });
        prependMethod(mergedOptions.chart.events, 'addSeries', function (e) {
          scope.config[axisName].currentMin = this[axisName][0].min || scope.config[axisName].currentMin;
          scope.config[axisName].currentMax = this[axisName][0].max || scope.config[axisName].currentMax;
        });
        mergedOptions[axisName] = angular.copy(config[axisName]);
      }
    });
    if (config.title) {
      mergedOptions.title = config.title;
    }
    if (config.subtitle) {
      mergedOptions.subtitle = config.subtitle;
    }
    if (config.credits) {
      mergedOptions.credits = config.credits;
    }
    return mergedOptions;
  };
  var updateZoom = function (axis, modelAxis) {
    var extremes = axis.getExtremes();
    if (modelAxis.currentMin !== extremes.dataMin || modelAxis.currentMax !== extremes.dataMax) {
      axis.setExtremes(modelAxis.currentMin, modelAxis.currentMax, false);
    }
  };
  var processExtremes = function (chart, axis, axisName) {
    if (axis.currentMin || axis.currentMax) {
      chart[axisName][0].setExtremes(axis.currentMin, axis.currentMax, true);
    }
  };
  var chartOptionsWithoutEasyOptions = function (options) {
    return angular.extend({}, options, {
      data: null,
      visible: null
    });
  };
  return {
    restrict: 'EAC',
    replace: true,
    template: '<div></div>',
    scope: { config: '=' },
    link: function (scope, element, attrs) {
      var prevSeriesOptions = {};
      var processSeries = function (series) {
        var ids = [];
        if (series) {
          var setIds = ensureIds(series);
          if (setIds) {
            return false;
          }
          angular.forEach(series, function (s) {
            ids.push(s.id);
            var chartSeries = chart.get(s.id);
            if (chartSeries) {
              if (!angular.equals(prevSeriesOptions[s.id], chartOptionsWithoutEasyOptions(s))) {
                chartSeries.update(angular.copy(s), false);
              } else {
                if (s.visible !== undefined && chartSeries.visible !== s.visible) {
                  chartSeries.setVisible(s.visible, false);
                }
                if (chartSeries.options.data !== s.data) {
                  chartSeries.setData(angular.copy(s.data), false);
                }
              }
            } else {
              chart.addSeries(angular.copy(s), false);
            }
            prevSeriesOptions[s.id] = chartOptionsWithoutEasyOptions(s);
          });
        }
        for (var i = chart.series.length - 1; i >= 0; i--) {
          var s = chart.series[i];
          if (indexOf(ids, s.options.id) < 0) {
            s.remove(false);
          }
        }
        return true;
      };
      var chart = false;
      var initChart = function () {
        if (chart)
          chart.destroy();
        var config = scope.config || {};
        var mergedOptions = getMergedOptions(scope, element, config);
        chart = config.useHighStocks ? new Highcharts.StockChart(mergedOptions) : new Highcharts.Chart(mergedOptions);
        for (var i = 0; i < axisNames.length; i++) {
          if (config[axisNames[i]]) {
            processExtremes(chart, config[axisNames[i]], axisNames[i]);
          }
        }
        if (config.loading) {
          chart.showLoading();
        }
      };
      initChart();

      // Moore team addition: para-stretch doesn't work well here, so we added a $watch to make it work:
      scope.$watch(function() {
    	  return element[0].offsetWidth + " " + element[0].offsetHeight;
      },function(size) {
    	 var width = size.split(" ")[0]-0;
    	 var height = size.split(" ")[1]-0;
    	 chart.setSize(width, height);
      });

      scope.$watch('config.series', function (newSeries, oldSeries) {
        var changed = processSeries(newSeries);
        if (changed) {
          chart.redraw();
        }
      }, true);
      scope.$watch('config.title', function (newTitle) {
        chart.setTitle(newTitle, true);
      }, true);
      scope.$watch('config.subtitle', function (newSubtitle) {
        chart.setTitle(true, newSubtitle);
      }, true);
      scope.$watch('config.loading', function (loading) {
        if (loading) {
          chart.showLoading();
        } else {
          chart.hideLoading();
        }
      });
      scope.$watch('config.credits.enabled', function (enabled) {
        if (enabled) {
          chart.credits.show();
        } else if (chart.credits) {
          chart.credits.hide();
        }
      });
      scope.$watch('config.useHighStocks', function (useHighStocks) {
        initChart();
      });
      angular.forEach(axisNames, function (axisName) {
        scope.$watch('config.' + axisName, function (newAxes, oldAxes) {
          if (newAxes === oldAxes)
            return;
          if (newAxes) {
            chart[axisName][0].update(newAxes, false);
            updateZoom(chart[axisName][0], angular.copy(newAxes));
            chart.redraw();
          }
        }, true);
      });
      scope.$watch('config.options', function (newOptions, oldOptions, scope) {
        if (newOptions === oldOptions)
          return;
        initChart();
        processSeries(scope.config.series);
        chart.redraw();
      }, true);
      scope.$on('$destroy', function () {
        if (chart)
          chart.destroy();
          // Moore team addition: calling element.remove() will cause another $destroy event, resulting in an exception.
//        element.remove();
      });
    }
  };
});