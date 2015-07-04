/**
 * inject angular-bootstrap-select
 * https://raw.githubusercontent.com/joaoneto/angular-bootstrap-select/v0.0.4/src/angular-bootstrap-select.js
 */

angular.module('angular-bootstrap-select', [])
    .directive('selectpicker', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.selectpicker($parse(attrs.selectpicker)());
                element.selectpicker('refresh');

                scope.$watch(attrs.ngModel, function (newVal, oldVal) {
                    scope.$parent[attrs.ngModel] = newVal;
                    scope.$evalAsync(function () {
                        if (!attrs.ngOptions || /track by/.test(attrs.ngOptions)) element.val(newVal);
                        element.selectpicker('refresh');
                    });
                });

                scope.$on('$destroy', function () {
                    scope.$evalAsync(function () {
                        element.selectpicker('destroy');
                    });
                });
            }
        };
    }]);