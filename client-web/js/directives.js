define(['app', 'socket.io'], function (app, io) {
    'use strict';
    //app.directive('ngCloak', function(){
    //    return {
    //        compile: function(element, attr) {
    //            attr.$set('ngCloak', undefined);
    //            element.removeClass('ng-cloak');
    //        }
    //    };
    //});
    app.directive('errSrc', function() {
        return {
            link: function(scope, element, attrs) {
                element.bind('error', function() {
                    if (attrs.src != attrs.errSrc) {
                        attrs.$set('src', attrs.errSrc);
                    }
                });
            }
        }
    });
    //密码验证
    app.directive('validPassword', function () {
        return {
            restrict: 'E',
            scope: {
                form: '@',
                name: '@'
            },
            replace: true,
            template: '<div class="error" ng-show="{{form}}.{{name}}.$dirty && {{form}}.{{name}}.$invalid">\
            <small class="error" ng-show="{{form}}.{{name}}.$error.required">Password is required.</small>\
            <small class="error" ng-show="{{form}}.{{name}}.$error.minlength">Password is required to be at least 8 characters.</small>\
            <small class="error" ng-show="{{form}}.{{name}}.$error.maxlength">Password cannot be longer than 20 characters.</small>\
            <small class="error" ng-show="!{{form}}.{{name}}.$error.minlength && {{form}}.{{name}}.$error.pattern">A password must contain at least 1 upper case letter, 1 lower case letter, 1 number or special character.</small>\
            </div>'
        };
    });
    app.directive('passwordMatch', function () {
        return {
            require: 'ngModel',
            scope: {
                otherModelValue: '=passwordMatch'
            },
            link: function (scope, element, attributes, ngModel) {
                ngModel.$validators.compareTo = function (modelValue) {
                    return modelValue === scope.otherModelValue;
                };
                scope.$watch('otherModelValue', function () {
                    ngModel.$validate();
                });
            }
        };
    });
    //判断用户是否存在
    app.directive('myIsexist', ['$http', '$timeout', '$q', function ($http, $timeout, $q) {
        var timer;
        return {
            require: 'ngModel',
            link: function (scope, ele, attrs, c) {
                $timeout.cancel(timer);
                c.$asyncValidators.isexist = function (modelValue) {
                    var defer = $q.defer();
                    timer = $timeout(function () {
                        $http({
                            method: 'POST',
                            url: '/api/v3/check',
                            data: {
                                field: attrs.isexist,
                                value: modelValue
                            }
                        }).success(function (data) {
                            if (data)
                                defer.reject();
                            else
                                defer.resolve();
                        }).error(function (data) {
                            defer.reject();
                        });
                    }, 1500);
                    return defer.promise;
                }
            }
        };
    }]);
    app.directive('coinlogo', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="coinMenu">\
            <div class="menu" ng-click="showCoin($event)"><img width="40px" ng-src="/public/images/coin/{{coin|coinToShortName|toLowerCase}}.png" class="mainIcon"><span class="coinclose"></span></div>\
            <div ng-repeat="item in coinLogoList" ng-class="{true:\'opacity\'}[item.offine]" class="coinbtn coinclose"><img data="{{item.coin}}" ng-click="click($event)" width="40px" ng-src="/public/images/coin/{{item.short}}.png"></div>\
            </div>',
            controller: function ($scope, $http) {
                $scope.coinLogoList = [];
                $scope.reset = function () {
                    var n = 1;
                    $('.coinbtn').each(function () {
                        if ($(this).find('img').attr('data') == $scope.coin)
                            return;
                        $(this).fadeIn(250);
                        $(this).css('right', 60 * n);
                        n++;
                    });
                };
                $scope.click = function (e) {
                    var self = $(e.target);
                    $scope.coin = self.attr('data');
                    $.cookie('coin', $scope.coin, {path: "/"});
                    self.parent().fadeOut(250);
                    $scope.reset();
                    $scope.clickCoinLogo();
                };
                $scope.showCoin = function (event) {
                    var span = $(event.currentTarget).find("span");
                    if (span.hasClass("coinopen")) {
                        $('.coinbtn').css('right', 0);
                        span.removeClass("coinopen").addClass("coinclose");
                        $(".coinbtn").removeClass("coinopen").addClass("coinclose");
                    } else {
                        var n = 1;
                        $('.coinbtn').each(function () {
                            $(this).fadeIn(250);
                            $(this).css('right', 60 * n);
                            n++;
                        });
                        span.removeClass("coinclose").addClass("coinopen");
                        $(".coinbtn").removeClass("coinclose").addClass("coinopen");
                    }
                };
                $scope.LoadCoin = function () {
                    $scope.coinLogoList = [];
                    $http.get(SERVER_BASE_URL + '/api/v3/data/coin').success(function (result) {
                        var newCoinDict = result;
                        for (var item in newCoinDict) {
                            if (!Coins[item].shortName) continue;
                            $scope.coinLogoList.push({
                                coin: item,
                                short: Coins[item].shortName.toLowerCase(),
                                offine: Coins[item].offline
                            });
                        }
                    });

                    $scope.coin = $.cookie('coin');
                    if (!$scope.coin) {
                        $scope.coin = 'DogeCoin';
                        $.cookie('coin', $scope.coin, {path: "/"});
                    }
                };
                $scope.LoadCoin();
            }
        };
    });
    app.directive('passwordStrength', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                var indicator = element.children();
                var dots = Array.prototype.slice.call(indicator.children());
                var weakest = dots.slice(-1)[0];
                var weak = dots.slice(-2);
                var strong = dots.slice(-3);
                var strongest = dots.slice(-4);

                element.after(indicator);

                element.bind('keyup', function () {
                    var matches = {
                            positive: {},
                            negative: {}
                        },
                        counts = {
                            positive: {},
                            negative: {}
                        },
                        tmp,
                        strength = 0,
                        letters = 'abcdefghijklmnopqrstuvwxyz',
                        numbers = '01234567890',
                        symbols = '\\!@#$%&/()=?¿',
                        strValue;

                    angular.forEach(dots, function (el) {
                        el.style.backgroundColor = '#ebeef1';
                    });

                    if (ngModel.$viewValue) {
                        // Increase strength level
                        matches.positive.lower = ngModel.$viewValue.match(/[a-z]/g);
                        matches.positive.upper = ngModel.$viewValue.match(/[A-Z]/g);
                        matches.positive.numbers = ngModel.$viewValue.match(/\d/g);
                        matches.positive.symbols = ngModel.$viewValue.match(/[$-/:-?{-~!^_`\[\]]/g);
                        matches.positive.middleNumber = ngModel.$viewValue.slice(1, -1).match(/\d/g);
                        matches.positive.middleSymbol = ngModel.$viewValue.slice(1, -1).match(/[$-/:-?{-~!^_`\[\]]/g);

                        counts.positive.lower = matches.positive.lower ? matches.positive.lower.length : 0;
                        counts.positive.upper = matches.positive.upper ? matches.positive.upper.length : 0;
                        counts.positive.numbers = matches.positive.numbers ? matches.positive.numbers.length : 0;
                        counts.positive.symbols = matches.positive.symbols ? matches.positive.symbols.length : 0;

                        counts.positive.numChars = ngModel.$viewValue.length;
                        tmp += (counts.positive.numChars >= 8) ? 1 : 0;

                        counts.positive.requirements = (tmp >= 3) ? tmp : 0;
                        counts.positive.middleNumber = matches.positive.middleNumber ? matches.positive.middleNumber.length : 0;
                        counts.positive.middleSymbol = matches.positive.middleSymbol ? matches.positive.middleSymbol.length : 0;

                        // Decrease strength level
                        matches.negative.consecLower = ngModel.$viewValue.match(/(?=([a-z]{2}))/g);
                        matches.negative.consecUpper = ngModel.$viewValue.match(/(?=([A-Z]{2}))/g);
                        matches.negative.consecNumbers = ngModel.$viewValue.match(/(?=(\d{2}))/g);
                        matches.negative.onlyNumbers = ngModel.$viewValue.match(/^[0-9]*$/g);
                        matches.negative.onlyLetters = ngModel.$viewValue.match(/^([a-z]|[A-Z])*$/g);

                        counts.negative.consecLower = matches.negative.consecLower ? matches.negative.consecLower.length : 0;
                        counts.negative.consecUpper = matches.negative.consecUpper ? matches.negative.consecUpper.length : 0;
                        counts.negative.consecNumbers = matches.negative.consecNumbers ? matches.negative.consecNumbers.length : 0;

                        // Calculations
                        strength += counts.positive.numChars * 4;
                        if (counts.positive.upper) {
                            strength += (counts.positive.numChars - counts.positive.upper) * 2;
                        }
                        if (counts.positive.lower) {
                            strength += (counts.positive.numChars - counts.positive.lower) * 2;
                        }
                        if (counts.positive.upper || counts.positive.lower) {
                            strength += counts.positive.numbers * 4;
                        }
                        strength += counts.positive.symbols * 6;
                        strength += (counts.positive.middleSymbol + counts.positive.middleNumber) * 2;
                        strength += counts.positive.requirements * 2;

                        strength -= counts.negative.consecLower * 2;
                        strength -= counts.negative.consecUpper * 2;
                        strength -= counts.negative.consecNumbers * 2;

                        if (matches.negative.onlyNumbers) {
                            strength -= counts.positive.numChars;
                        }
                        if (matches.negative.onlyLetters) {
                            strength -= counts.positive.numChars;
                        }

                        strength = Math.max(0, Math.min(100, Math.round(strength)));

                        if (strength > 85) {
                            angular.forEach(strongest, function (el) {
                                el.style.backgroundColor = '#008cdd';
                            });
                        } else if (strength > 65) {
                            angular.forEach(strong, function (el) {
                                el.style.backgroundColor = '#6ead09';
                            });
                        } else if (strength > 30) {
                            angular.forEach(weak, function (el) {
                                el.style.backgroundColor = '#e09115';
                            });
                        } else {
                            weakest.style.backgroundColor = '#e01414';
                        }
                    }
                });
            },
            template: '<span class="password-strength-indicator"><span></span><span></span><span></span><span></span></span>'
        };
    });

    //app.directive('ckeditor', function() {
    //    return {
    //        require : '?ngModel',
    //        link : function(scope, element, attrs, ngModel) {
    //            var ckeditor = CKEDITOR.replace(element[0], {
    //
    //            });
    //            if (!ngModel) {
    //                return;
    //            }
    //            ckeditor.on('instanceReady', function() {
    //                ckeditor.setData(ngModel.$viewValue);
    //            });
    //            ckeditor.on('pasteState', function() {
    //                scope.$apply(function() {
    //                    ngModel.$setViewValue(ckeditor.getData());
    //                });
    //            });
    //            ngModel.$render = function(value) {
    //                ckeditor.setData(ngModel.$viewValue);
    //            };
    //        }
    //    };
    //});
});