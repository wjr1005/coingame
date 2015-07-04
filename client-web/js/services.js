define(['app', 'socket.io', 'toastr'], function (app, io, toastr) {
    'use strict';
    app.factory('Authentication', function(){
        this.isAuth = false;
        this.email = null;
        this.isConnected = false;
        return {
            setUser : function(username){
                this.username = username;
            },
            removeUser : function() {
                self.username = null;
            }
        }
    });
    //消息
    app.factory("Logger", function () {
        var self = this;
        return toastr.options = {
            closeButton: !0,
            positionClass: "toast-bottom-right",
            timeOut: "3500"
        }, this.logIt = function (message, type) {
            toastr[type](message)
        }, {
            log: function (type, message) {
                self.logIt(message, type)
            }, logWarning: function (message) {
                self.logIt(message, "warning")
            }, logSuccess: function (message) {
                self.logIt(message, "success")
            }, logError: function (message) {
                self.logIt(message, "error")
            }
        }
    });

    //警告服务
    app.service('alertService', function () {
        this.init = function (scope) {
            scope.alerts = [];
            scope.addAlert = function (type, msg) {
                scope.alerts.push({type: type, msg: msg});
            };
            scope.closeAlert = function (index) {
                scope.alerts.splice(index, 1);
            };
        }
    });
    //socket.io
    app.factory('socket', function ($rootScope, $timeout, $auth) {
        /* 定位 socket IO 服务器, 括弧把 ip 弄上 */
        var socket;// = io.connect('//' + document.domain + ':9000', { 'reconnect': false});
        return {
            connect: function (server) {
                socket = io.connect(server, {
                    query: 'token=' + $auth.getToken(),
                    'force new connection': true,
                    'reconnect': false
                });
            },
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            },
            disconnect: function () {
                if (!socket) return;
                $timeout(function () {
                    socket.disconnect();
                }, 0, false);
            },
            removeListener: function (str) {
                socket.removeListener(str);
            }
        };
    });
});