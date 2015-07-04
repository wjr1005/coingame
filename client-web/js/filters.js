define(['app'], function (app) {
    'use strict';
    app.filter('i18n', function () {
        return function () {
            //return i18n.t( arguments[0] );
            return arguments[0];
        }
    });
    app.filter('toTimeStr', function () {
        return function () {
            return share.toTimeStr(arguments[0]);
        }
    });
    app.filter('toDayStr', function () {
        return function () {
            return share.toTimeStr(arguments[0], 0, 'yyyy-MM-dd');
        }
    });
    app.filter('getObjectLength', function () {
        return function () {
            return share.getObjectlength(arguments[0]);
        }
    });
    app.filter('formatNumber', function () {
        return function () {
            return (arguments[0] + '').formatNumber();
        }
    });
    app.filter('coinToShortName', function () {
        return function () {
            return share.coinToShortName(arguments[0]);
        }
    });
    app.filter('toLowerCase', function () {
        return function () {
            return arguments[0].toLowerCase();
        }
    });
    app.filter('dictToArray', function () {
        return function () {
            return share.dictToList(arguments[0]);
        }
    });
    app.filter('dictToHtml', function () {
        return function () {
            return share.dictToHtml(arguments[0]);
        }
    });
    app.filter('parse', function () {
        return function () {
            return share.parse(arguments[0]);
        }
    });
    app.filter('toText', function(){
        return function () {
            return share.toText(arguments[0]);
        }
    });
});