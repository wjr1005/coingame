define(['app', 'require', 'socket.io'], function (app, require, io) {
    'use strict';
    app.controller('AppController', function($scope, $modal, $location, $http, $auth, $rootScope, cfpLoadingBar, Authentication){
        //是否开启声音
        if ($.cookie('isOpenSound') == 'false')
            $scope.isOpenSound = false;
        else
            $scope.isOpenSound = true;
        $scope.showModalPassword = function(callback){
            var modalInstance = $modal.open({
                templateUrl: '/views/user/validPassWord.html',
                controller: 'ValidPassWordController'
            }).result.then(function() {
                    callback(!0);
                }, function() {
                    callback(!1);
                }
            );
        };
        $scope.isHideHeader = function(){
            if (_.contains(["/login", '/connecting'], $location.path())) return true;
            if ($location.path() == '/games/dice') return false;
            if ($location.path().indexOf('/games/') != -1) return true;
            return false;
        };
        $scope.isAuthenticated = function(){
            if ($auth.isAuthenticated())
                return true;
            else
                return false;
        };
        $scope.validate = function(){
            if (!$auth.isAuthenticated())
                $location.path('/login');
        };
        $scope.checkIsLogin = function(){
            if ($auth.isAuthenticated())
                $location.path('/balances');
            else
                $location.path('/login');
        };
        $scope.sound = function(event){
            $scope.isOpenSound = !$scope.isOpenSound;
            $.cookie('isOpenSound', $scope.isOpenSound, {path:'/', expiress: 360});
        };
        $scope.isConnecting = function(){
            return Authentication.isConnected;
        };

        $rootScope.$on("user-logged-in", function(event, data) {
            $location.path("/connecting");
        });
        //$auth.isAuthenticated() && ($scope.requestedPage = $location.path());
        $scope.requestedPage = $location.path();
        $rootScope.$broadcast("user-logged-in");
        //document.getElementById('footer').style.display = 'block';

        $scope.speed = 0;
        $scope.avatarurl = '';
        $scope.myUserName = '';
        $scope.siteVer = siteVer;
        $scope.userInfo = function(callback){
            $http.get(SERVER_BASE_URL+'/api/v3/userInfo').success(function(result){
                Authentication.setUser(result.username);
                Authentication.email = result.email;
                Authentication.isAuth = result.isAuth;
                Authentication.avatarurl = result.avatarurl;
                $scope.myUserName = result.username;
                $scope.avatarurl = result.avatarurl;
                $scope.notices = result.notices;
                $scope.ver = result.ver;
                var speed = share.getNowTime() - result.speed;
                $scope.speed = (10000-speed)/100;
                setTimeout(function(){
                    $('.ng-cloak').removeClass('ng-cloak');
                }, 1000);
                if (callback) callback();
            }).error(function(result){
                if (callback) callback();
            });
        };
    });
    app.controller("ConnectingController", function($scope, $http, $location, Authentication) {
        $scope.back = function() {
            $location.path(!$scope.requestedPage||$scope.requestedPage=='/connecting'?"home":$scope.requestedPage);
        };
        $scope.userInfo(function(){
            $scope.back();
        });
    });
    app.controller('HeaderController', function($scope, $location, $auth, $modal, $http, $translate, cfpLoadingBar, Logger, Authentication){
        require(['soundmanager2'], function(){
            soundManager.setup({
                url:'js/sm2/swf/',
                onready: function() {
                    //声音
                    $scope.snowSound = soundManager.createSound({
                        url: '/public/sound/snow.mp3'
                    });
                }
            });

            $scope.lang = $translate.use() || "en-US";
            $scope.setLang = function(langKey) {
                // You can change the language during runtime
                $translate.use(langKey);
                $scope.lang = langKey;
            };

            $scope.logout = function(){
                if (!$auth.isAuthenticated()) {
                    return;
                }
                $auth.logout()
                    .then(function() {
                        $location.path('/login');
                        Logger.logSuccess('You have been logged out');
                    });
            };
            $scope.seed = function(){
                var modalInstance = $modal.open({
                    templateUrl: '/views/user/seed.html',
                    controller: 'SeedController'
                });
            };
            $scope.messagePage = 0;
            $scope.messageAmount = 0;
            $scope.isShowMessage = false;
            $scope.showMessage = function(){
                $scope.isShowMessage = !$scope.isShowMessage;
                $scope.messageAmount = 0;
                $scope.messagePage = 0;
                $scope.webSocketIo.emit('getmsg', $scope.messagePage);
            };
            $scope.messageList = [];
            $scope.webSocketIo = io.connect(SERVER_BASE_URL, {query:'token='+$auth.getToken(), 'force new connection': true});
            $scope.webSocketIo.on('snow', function(data){
                $.fn.snow(data, function(){
                    if ($scope.isOpenSound)
                        $scope.snowSound.play();
                },function(id){
                    $scope.webSocketIo.emit('snow', id);
                });
            });
            $scope.webSocketIo.on('deleteSnow', function(data){
                $('#snow_'+data.id+' img').attr('src', '/public/images/coin/explosion.png');
                $('#snow_'+data.id).unbind("click");
                if (data.amount)
                    AddWinning(data.username+' '+$translate.instant('get')+' '+data.amount.toFixedEx(8)+' '+data.coin);
            });
            //消息
            $scope.webSocketIo.on('msglist', function(data){
                $scope.$apply(function() {
                    $scope.messageList = data;
                });
                $('#messages .content').animate({scrollTop: $('#messages .content')[0].scrollHeight}, 300);
            });
            $scope.webSocketIo.on('msg', function(data){
                $scope.$apply(function() {
                    if ($scope.messageList.length > 20)
                        $scope.messageList.shift();
                    $scope.messageList.push(data);
                    if (!$scope.isShowMessage) $scope.messageAmount++;
                });
                $('#messages .content').animate({scrollTop: $('#messages .content')[0].scrollHeight}, 300);
            });
            $scope.webSocketIo.on('message', function(data){
                Logger.log(data.type, data.message);
            });

            $scope.moreMessage = function(){
                $scope.webSocketIo.emit('getmsg', $scope.messagePage);
                $scope.messagePage++;
            };
            $scope.sendMessage = function(){
                var msg = $('#sayText').html();
                $scope.webSocketIo.emit('msg', msg);
                $('#sayText').html('');
            };

            //离开时关闭定时器
            $scope.$on('$destroy', function() {
                $scope.webSocketIo && $scope.webSocketIo.disconnect();
                $scope.webSocketIo = null;
            });
        });
    });
    app.controller('SeedController', function($scope, $http, $modalInstance, cfpLoadingBar){
        var last_cseed = '';
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/seed').success(function(result){
            cfpLoadingBar.complete();
            $scope.cseed = result.cseed;
            $scope.shash = result.shash;
            last_cseed = $scope.cseed;
        });

        $scope.random = function(){
            var data = {};
            if (last_cseed != $scope.cseed)
            {
                last_cseed = $scope.cseed;
                data['cseed'] = last_cseed;
            }
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/seed', data).success(function(result){
                cfpLoadingBar.complete();
                $scope.cseed = result.cseed;
                $scope.shash = result.shash;
                last_cseed = $scope.cseed;
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });
    app.controller('HomeController', function($scope, $http, cfpLoadingBar){
        $scope.rate = 7;
        $scope.max = 10;
        $scope.isReadonly = true;
        $scope.gameList = [];
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/gameInfo').success(function(result){
            cfpLoadingBar.complete();
            $scope.games = result;
        });
    });
    app.controller('SigninController', function ($scope, $http, $location, $translate, cfpLoadingBar, $auth, Logger) {
        $scope.loginCanSubmit = function(){
            return $scope.loginform.$valid && !$scope.loginform.$submitted;
        };
        $scope.registerCanSubmit = function() {
            return $scope.registerform.$valid && !$scope.registerform.$submitted;
        };
        $scope.recoverCanSubmit = function() {
            return $scope.recoverform.$valid && !$scope.recoverform.$submitted;
        };

        var login = $('#loginform');
        var recover = $('#recoverform');
        var register = $('#registerform');
        var login_recover = $('#loginform, #recoverform');
        var login_register = $('#loginform, #registerform');
        var recover_register = $('#recoverform, #registerform');
        var loginbox = $('#loginbox');

        var animation_speed = 300;
        function switch_container(to_show, to_hide) {
            to_hide.hide();
            to_show.show();
        }

        $scope.page = 'login';
        $scope.register = function(){
            switch_container(register,login_recover);
        };
        $scope.login = function(){
            switch_container(login,recover_register);
        };
        $scope.recover = function(){
            switch_container(recover,login_register);
        };

        $scope.loginSubmit = function() {
            $auth.login({ username: $scope.login_username, password: $scope.login_password , gauth:$scope.gauth})
                .then(function(response) {
                    Logger.logSuccess('You have successfully logged in');
                    $scope.loginform.$submitted = !1;
                    $scope.userInfo();
                })
                .catch(function(response) {
                    $scope.loginform.$submitted = !1;
                    if (response.data)
                        Logger.logError(response.data.message);
                });
        };
        $scope.registerSubmit = function(){
            var referrer = $.cookie('referrer');
            var from = document.domain.split('.').slice(1).join('.');
            cfpLoadingBar.start();
            $auth.signup({
                username : $scope.reg_username,
                password : $scope.reg_password,
                email : $scope.reg_email,
                referrer : referrer,
                from : from
            }).catch(function(response) {
                $scope.registerform.$submitted = !1;
                cfpLoadingBar.complete();
                //if (typeof response.data.message === 'object') {
                //    Logger.logSuccess('Registered successfully');
                //}else{
                Logger.logError(response.data.message);
                //}
            });
        };
        $scope.recoverSubmit = function(){
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/recover', {email:$scope.email}).success(function(result){
                cfpLoadingBar.complete();
                Logger.logSuccess($translate.instant('We just sent you an email with instructions to reset your password, if that account exists.'));
            }).error(function(result){
                $scope.recoverform.$submitted = !1;
                if (result.message) Logger.logError(result.message);
            });
        };
    });
    app.controller('SidebarController', ['$scope', function($scope){
        require([
                'jquery.nicescroll',
                '/public/lib/qqface/jquery.qqFace.js',
                '/public/lib/snow.js',
                'site'
            ],
            function(){
                $('#emotion-btn').qqFace({
                    id : 'facebox', //表情盒子的ID
                    assign:'saytext', //给那个控件赋值
                    path:'/public/lib/qqface/face/'	//表情存放的路径
                });
            }
        );
    }]);

    app.controller('BalancesController', function($scope, $http, $modal, cfpLoadingBar, Logger, socket){
        cfpLoadingBar.start();
        $scope.angents = [];
        $http.get(SERVER_BASE_URL+'/api/v3/balances').success(function(result){
            cfpLoadingBar.complete();
            $scope.totalBalance = result.totalBalance.toFloat();
            $scope.coins = result.coins;
            $scope.site = result.site;
            $scope.agents = result.agents;
            $scope.totalAgent = result.totalAgent;
            $scope.agentPlayerAcount = result.agentPlayerAcount;
        });

        $scope.DepositDialog = function(coin)
        {
            var modalInstance = $modal.open({
                templateUrl: '/views/user/deposit.html',
                controller: 'DepositController',
                resolve : {
                    coins : function(){
                        return $scope.coins[coin];
                    }
                }
            });
        };
        $scope.WithdrawDialog = function(coin)
        {
            //$scope.showModalPassword(function(valid) {
            //     if (valid)
            //     {
            var modalInstance = $modal.open({
                templateUrl: '/views/user/withdraw.html',
                controller: 'WithdrawController',
                resolve : {
                    coin : function(){
                        return coin;
                    },
                    balance : function(){
                        return $scope.coins[coin].balance
                    },
                    withdrawAddress : function(){
                        return $scope.coins[coin].withdrawAddress
                    }
                }
            });
            //}
            //});
        };
        $scope.TransferDialog = function(coin){
            var modalInstance = $modal.open({
                templateUrl: '/views/user/transfer.html',
                controller: 'TransferController',
                resolve : {
                    coin : function(){
                        return coin;
                    },
                    balance : function(){
                        return $scope.coins[coin].balance
                    }
                }
            });
        };
    });
    //充值
    app.controller('DepositController', function($scope, $http, $modalInstance, Logger, coins){
        $scope.coin = coins.coin;
        $scope.address = coins.address;
        $scope.ok = function () {
            $modalInstance.close();
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.createDeposit = function(){
            $scope.disable = true;
            $http.post(SERVER_BASE_URL+'/api/v3/getWalletAddress', {coin:$scope.coin}).success(function(result){
                $scope.address = result.address;
                coins.address = $scope.address;
                $scope.disable = false;
            }).error(function(result){
                $scope.disable = false;
                Logger.logError(result.message);
            });
        };
    });
    //提现
    app.controller('WithdrawController', function($scope, $http, $modalInstance, cfpLoadingBar, Logger, coin, balance, withdrawAddress){
        $scope.coin = coin;
        $scope.fee = Coins[coin].limit;
        $scope.withdrawAddress = withdrawAddress;
        $scope.balance = balance;
        $scope.ok = function () {
            $modalInstance.close();
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.canSubmit = function() {
            return $scope.withdrawForm.$valid && !$scope.withdrawForm.$submitted;
        }
        $scope.submit = function(){
            if (!$scope.amount || !$scope.withdrawAddress) return;
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/withdraw', {coin:$scope.coin, amount:$scope.amount, address:$scope.withdrawAddress}).success(function(result){
                cfpLoadingBar.complete();
                $scope.withdrawForm.$submitted = !1;
                $scope.balance -= $scope.amount;
                Logger.logSuccess('Withdrawal success');
            }).error(function(error) {
                $scope.withdrawForm.$submitted = !1;
                cfpLoadingBar.complete();
                Logger.logError(error.message);
            });
        };
    });
    //转帐
    app.controller('TransferController', function($scope, $http, $modalInstance, cfpLoadingBar, Logger, coin, balance) {
        $scope.coin = coin;
        $scope.balance = balance;
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.canSubmit = function() {
            return $scope.transferForm.$valid && !$scope.transferForm.$submitted;
        };
        $scope.submit = function()
        {
            if (!$scope.amount || !$scope.toUser) return;
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/transfer', {coin:$scope.coin, amount:$scope.amount, toUser:$scope.toUser, remark:$scope.remark}).success(function(result){
                $scope.transferForm.$submitted = !1;
                cfpLoadingBar.complete();
                Logger.logSuccess('Transfer success');
                $scope.balance -= $scope.amount;
            }).error(function(error) {
                $scope.transferForm.$submitted = !1;
                cfpLoadingBar.complete();
                Logger.logError(error.message);
            })
        };
    });
    //充值历史
    app.controller('DepositHistoryController', function($scope, $http, $stateParams, cfpLoadingBar) {
        $scope.coin = $stateParams.coin;
        $scope.currentPage = 1;
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/history/deposit/'+$scope.coin).success(function(result){
            cfpLoadingBar.complete();
            $scope.historyList = result.historyList || [];
        });
    });
    //提现历史
    app.controller('WithdrawHistoryController', function($scope, $http, $stateParams, cfpLoadingBar) {
        $scope.coin = $stateParams.coin;
        $scope.currentPage = 1;
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/history/withdraw/'+$scope.coin).success(function(result){
            cfpLoadingBar.complete();
            $scope.historyList = result.historyList || [];
        });
    });
    //转帐历史
    app.controller('TransferHistoryController', function($scope, $http, $stateParams, cfpLoadingBar) {
        $scope.coin = $stateParams.coin;
        $scope.currentPage = 1;
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/history/transfer/'+$scope.coin).success(function(result){
            cfpLoadingBar.complete();
            $scope.historyList = result.historyList || [];
            $scope.totalItems = result.totalItems;
        });
    });
    app.controller('ProfileController', function($scope, $http, cfpLoadingBar){
    });
    app.controller('ReferrerController', function($scope, $http, $location, cfpLoadingBar){
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/getReferrer').success(function(result){
            cfpLoadingBar.complete();
            $scope.userId = result.userId;
            $scope.referrerList = result.referrerList;
            $scope.referrerUrl = document.location.protocol + '//' + window.domain +'/r/' + $scope.userId;
        })
    });
    app.controller('SecurityController', function($scope, $http, cfpLoadingBar){
        $scope.currentPage = 1;
        $scope.$watch('currentPage', function() {
            cfpLoadingBar.start();
            $http.get(SERVER_BASE_URL+'/api/v3/logging?p='+$scope.currentPage).success(function(result){
                cfpLoadingBar.complete();
                $scope.historyList = result.resultList;
                $scope.totalItems = result.totalItems;
            });
        });
    });
    app.controller('ChangeEmailController', function($scope, $http, cfpLoadingBar, Logger, Authentication){
        $scope.email = Authentication.email;
        $scope.canSubmit = function() {
            return $scope.changeEmailForm.$dirty && $scope.changeEmailForm.$valid && !$scope.changeEmailForm.$submitted;
        };
        $scope.revert = function() {
            $scope.newEmail = '';
            $scope.changeEmailForm.$setPristine();
        };
        $scope.submit = function(){
            $scope.showModalPassword(function(valid) {
                if (valid)
                {
                    cfpLoadingBar.start();
                    $http.post(SERVER_BASE_URL+'/api/v3/changeEmail', {email:$scope.newEmail}).success(function(result){
                        $scope.changeEmailForm.$submitted = !1;
                        cfpLoadingBar.complete();
                        $scope.email = result;
                        Authentication.email = result;
                        $scope.revert();
                        Logger.logSuccess('Email updated');
                    }).error(function(error) {
                        $scope.changeEmailForm.$submitted = !1;
                        cfpLoadingBar.complete();
                        Logger.logError(error.message);
                    });
                }
            });
        };
        //cfpLoadingBar.start();
        //$http.get(SERVER_BASE_URL+'/api/v3/getEmail').success(function(result){
        //    cfpLoadingBar.complete();
        //    $scope.email = result;
        //});
    });
    app.controller('ChangePasswordController', function($scope, $http, cfpLoadingBar, Logger){
        $scope.canSubmit = function() {
            return $scope.changePasswordForm.$dirty && $scope.changePasswordForm.$valid && !$scope.changePasswordForm.$submitted;
        };
        $scope.revert = function() {
            $scope.password = '';
            $scope.confirmation = '';
            $scope.changePasswordForm.$setPristine();
        };
        $scope.submit = function(){
            $scope.showModalPassword(function(valid) {
                if (valid)
                {
                    cfpLoadingBar.start();
                    $http.post(SERVER_BASE_URL+'/api/v3/changePassword', {newPassword:$scope.password}).success(function(result){
                        $scope.changePasswordForm.$submitted = !1;
                        cfpLoadingBar.complete();
                        Logger.logSuccess('Password is changed');
                        $scope.revert();
                    }).error(function(error) {
                        $scope.changePasswordForm.$submitted = !1;
                        cfpLoadingBar.complete();
                        Logger.logError(error.message);
                        $scope.revert();
                    });
                }
            });
        };
    });
    app.controller('TwoFactorController', function($scope, $state, $http, Logger, cfpLoadingBar, Authentication){
        $scope.twoFactorEnable = {code: ""};
        $scope.twoFactorDisable = {code: ""};
        $state.transitionTo(Authentication.isAuth ? "profile.two-factor-disable" : "profile.two-factor-enable");
        //if (Authentication.isAuth) $state.transitionTo("profile.two-factor-disable");
        $scope.generate = function(callback) {
            $http.get(SERVER_BASE_URL+"/auth/otp").success(function(response) {
                callback(null, response)
            }).error(function(error) {
                callback(error)
            })
        };
        $scope.setupTwoFactor = function() {
            $scope.showModalPassword(function(valid) {
                if (valid){
                    $scope.generate(function(err, doc) {
                        return err?Logger.logError(err.message):($scope.twoFactor = doc,$state.transitionTo("profile.two-factor-setup"));
                    });
                }
            });
        };
        $scope.enableTwoFactor = function(){
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+"/auth/otp", {code:$scope.twoFactorEnable.code, open:true}).success(function(response){
                cfpLoadingBar.complete();
                $state.transitionTo("profile.two-factor-disable");
            }).error(function(result){
                Logger.logError(result.message);
            });
        };
        $scope.disableTwoFactor = function(){
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+"/auth/otp", {code:$scope.twoFactorDisable.code, open:false}).success(function(response){
                cfpLoadingBar.complete();
                $scope.twoFactor = response;
                Authentication.isAuth = false;
                $state.transitionTo("profile.two-factor-setup");
            }).error(function(result){
                Logger.logError(result.message);
            });
        };
    });
    app.controller('ValidPassWordController', function($scope, $http, $modalInstance, Logger){
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.isValid = function(){
            if (!$scope.password)
                return false;
            return $scope.validPasswordForm.$dirty&&$scope.validPasswordForm.$valid&&!$scope.validPasswordForm.$submitted;
        };
        $scope.submit = function(){
            $http.post(SERVER_BASE_URL+'/api/v3/checkPassword', {password:$scope.password}).success(function(result){
                $scope.validPasswordForm.$submitted = !1;
                $modalInstance.close();
            }).error(function(result){
                $scope.validPasswordForm.$submitted = !1;
                Logger.logError(result.message);
            });
        };
    });
    app.controller('StockController', function($scope, $http, cfpLoadingBar){
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/stock').success(function(result) {
            cfpLoadingBar.complete();
            $scope.coinScale = result.coinScale;
            $scope.siteProfitDict = result.siteProfitDict;
            $scope.playerStockNumber = result.playerStockNumber;
            $scope.siteStockNumber = result.siteStockNumber;
            if ($scope.siteStockNumber < 2300*10000)
                $scope.times = 0.01;
            else if ($scope.siteStockNumber < 2300*10000)
                $scope.times = 0.02;
            else if ($scope.siteStockNumber >= 2300*10000 && $scope.siteStockNumber < 2500*10000)
                $scope.times = 0.03;
            else if ($scope.siteStockNumber > 2900*10000 && $scope.siteStockNumber <= 3000*10000)
                $scope.times = 0.04;
            else
                $scope.times = 0.04;
            $scope.siteHaveDividend = result.siteHaveDividend;
            $scope.userHaveDividend = result.userHaveDividend;
            $scope.myShareDividendDict = result.myShareDividendDict;
            $scope.myNotShareDividendDict = result.myNotShareDividendDict;
            $scope.siteShareDividendHistorys = result.siteShareDividendHistorys;
            $scope.myShareDividendHistorys = result.myShareDividendHistorys;
            $scope.siteProfit = result.siteProfit;
            $scope.perShare = share.toNumber($scope.siteProfit/$scope.siteStockNumber);
            $scope.myStockProfit = result.myStockProfit;
            $scope.myInternalStockBalance = result.myInternalStockBalance;
            $scope.myStockBalance = result.myStockBalance;
        });
    });

    //投资
    app.controller('InvestController', function($scope, $http, $modal, $interval, cfpLoadingBar, Logger) {
        $scope.coin = $.cookie('coin') || 'DogeCoin';
        $scope.clickCoinLogo = function(){
            $scope.updateData(1);
        };

        $scope.updateData = function(type){
            if (type) cfpLoadingBar.start();
            $http.get(SERVER_BASE_URL+'/api/v3/invest/'+$scope.coin).success(function(result){
                //$scope.coin = result.coin;
                if (type) cfpLoadingBar.complete();
                $scope.bank = result.bank;
                $scope.profit = result.profit;
                $scope.allInvestment = result.allInvestment;
                $scope.myprofit = result.myprofit;
                $scope.balance = result.balance;
                $scope.invest_pct = result.invest_pct;
            });
        };
        $scope.updateData(1);
        var interval = $interval(function(){
            $scope.updateData(0);
        }, 10000);
        //离开时关闭定时器
        $scope.$on('$destroy', function() {
            $interval.cancel(interval);
        });

        $scope.ShowInvestors = function(){
            var modalInstance = $modal.open({
                templateUrl: '/views/user/investors.html',
                controller: 'InvestorsController',
                resolve : {
                    coin : function(){
                        return $scope.coin;
                    }
                }
            });
        };

        $scope.Invest = function(amount){
            if (!$scope.invest_input && !amount) return;
            var invest_amount;
            if (amount)
                invest_amount = amount;
            else
                invest_amount = $scope.invest_input;
            cfpLoadingBar.start();
            $scope.fakeIntro = true;
            $http.post(SERVER_BASE_URL+'/api/v3/invest/'+$scope.coin, {amount:invest_amount}).success(function(result){
                cfpLoadingBar.complete();
                Logger.logSuccess('Invest Success');
                $scope.fakeIntro = false;
                $scope.updateData(1);
            }).error(function(error){
                Logger.logError(error.message);
            });
        }
        $scope.Divest = function(amount){
            if (!$scope.divest_input && !amount) return;
            var divest_amount;
            if (amount)
                divest_amount = amount;
            else
                divest_amount = $scope.divest_input;
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/divest/'+$scope.coin, {amount:divest_amount}).success(function(result){
                cfpLoadingBar.complete();
                Logger.logSuccess('Divest Success');
                $scope.updateData(1);
            }).error(function(error){
                Logger.logError(error.message);
            });
        }
    });
    //投资者
    app.controller('InvestorsController', function($scope, $http, $modalInstance, Logger, cfpLoadingBar, coin) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/investors/'+coin).success(function(result){
            cfpLoadingBar.complete();
            $scope.resultList = result.resultList;
            $scope.allInvestment = result.allInvestment;
            $scope.allProfit = result.allProfit;
            $scope.allShare = result.allShare;
        }).error(function(error){
            Logger.logError(error.message);
        });
    });
    app.controller('SiteBetHistoryController', function($scope, $http) {

    });
    app.controller('DailyStatisticalController', function($scope, $http) {
        var todayTime = share.getToday();
        $scope.timerList = [];
        for (var i = 0; i < 7; i++)
        {
            $scope.timerList.push({date:todayTime});
            todayTime -= 1000*60*60*24;
        }

        $scope.getData = function(date){
            $http.post(SERVER_BASE_URL+'/api/v3/dailyStatistical', {coin:$scope.coin, date:date}).success(function(result){
                $scope.date = result.date;
                $scope.dailyStatistical = result.dataList;
                $scope.totalBet = 0;
                $scope.totalProfit = 0;
                for (var item in result.dataList)
                {
                    $scope.totalBet += result.dataList[item].bet;
                    $scope.totalProfit += result.dataList[item].profit;
                }
            }).error(function(result){
                console.error(result);
            });
        };

        $scope.clickCoinLogo = function(){
            $scope.getData();
        };

        $scope.coin = $.cookie('coin') || 'DogeCoin';
        $scope.getData();
    });
    app.controller('CrowdfundingController', function($scope, $http, cfpLoadingBar){
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/crowdfunding').success(function(result){
            cfpLoadingBar.complete();
            var progress;
            for (var i = 0; i < result.length; i++)
            {
                result[i].progress = Math.floor(result[i].pledged/result[i].goal*100);
                result[i].daysLeft = share.getDaysLeft(result[i].startTime, result[i].endTime);
            }
            $scope.resultList = result;
        });
    });
    app.controller('CrowdfundingMyProjectController', function($scope, $http, $auth, $location, cfpLoadingBar){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/crowdfunding/myProject').success(function(result){
            cfpLoadingBar.complete();
            $scope.resultList = result;
        });
    });
    app.controller('CrowdfundingMyInvestmentController', function($scope, $http, $auth, $location, cfpLoadingBar){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/crowdfunding/myInvestment').success(function(result){
            cfpLoadingBar.complete();
            $scope.resultList = result;
        });
    });
    app.controller('CrowdfundingShowController', function($scope, $http, $stateParams, $modal, cfpLoadingBar, Logger, Authentication){
        $scope.id = $stateParams.id;
        //$scope.myUserName = Authentication.username;
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/crowdfunding/show/'+$scope.id).success(function(result){
            cfpLoadingBar.complete();
            $scope.createUser = result.createUser;
            $scope.title = result.title;
            $scope.content = result.content;
            $scope.pledged = result.pledged;
            $scope.symbol = result.symbol;
            $scope.goal = result.goal;
            $scope.progress = Math.floor(result.pledged/result.goal*100);
            $scope.days = share.getDays(result.startTime, result.endTime);
            $scope.daysLeft = share.getDaysLeft(result.startTime, result.endTime);
            $scope.balance = result.balance;

            $scope.progressList = result.progress.reverse();
        });
        $scope.subscribe = function(){
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/crowdfunding/subscribe', {id:$scope.id, amount:$scope.amount}).success(function(result){
                cfpLoadingBar.complete();
                Logger.logSuccess('认购成功');
                $scope.balance = result.balance;
                $scope.pledged = result.pledged;
                $scope.goal = result.goal;
                $scope.progress = Math.floor(result.pledged/result.goal*100);
            }).error(function(result){
                cfpLoadingBar.complete();
                Logger.logError(result.message);
            });
        };
        $scope.addProgress = function(){
            var scope = $scope;
            var modalInstance = $modal.open({
                templateUrl: '/views/crowdfunding/addProgress.html',
                controller: function($scope, $http, $modalInstance, id){
                    $scope.id = id;
                    $scope.content = '';
                    $scope.cancel = function () {
                        $modalInstance.dismiss('cancel');
                    };
                    $scope.canSubmit = function() {
                        return $scope.content.length > 0;
                    };
                    $scope.submit = function(){
                        cfpLoadingBar.start();
                        $http.post(SERVER_BASE_URL+'/api/v3/crowdfunding/addProgress', {id:$scope.id, title:$scope.title, content:$scope.content}).success(function(result){
                            $modalInstance.close();
                            cfpLoadingBar.complete();
                            scope.progressList.unshift({title:$scope.title, content:$scope.content, date:share.getNowTime()});
                        });
                    };
                },
                resolve : {
                    id : function(){
                        return $scope.id;
                    }
                }
            });
        };
    });
    app.controller('CrowdfundingAddController', function($scope, $http, $auth, $location, Logger){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        $scope.format = 'yyyy/MM/dd';
        $scope.today = function() {
            $scope.startTime = new Date().format($scope.format);
            //$scope.endTime =  $scope.startTime + 30*24*3600;
        };
        $scope.today();
        $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();
        $scope.startOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.startOpened = true;
        };
        $scope.endOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endOpened = true;
        };
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.add = function(){
            var startTime = $scope.startTime.getTime();
            var endTime = $scope.endTime.getTime();
            $http.post(SERVER_BASE_URL+'/api/v3/crowdfunding/add', {
                title : $scope.title,
                content : $scope.content,
                goal : $scope.goal,
                logo : $scope.logo,
                symbol : $scope.symbol,
                startTime : startTime,
                endTime : endTime
            }).success(function(result){
                Logger.logSuccess('众筹创建成功');
                $location.path('/crowdfunding/myProject');
            });
        };
    });
    app.controller('CrowdfundingEditController', function($scope, $http, $stateParams, $auth, $location, cfpLoadingBar, Logger){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        $scope.format = 'yyyy/MM/dd';
        $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();
        $scope.startOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.startOpened = true;
        };
        $scope.endOpen = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endOpened = true;
        };
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.id = $stateParams.id;
        $scope.isModify = true;
        var backData = {};
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/crowdfunding/edit/'+$scope.id).success(function(result){
            cfpLoadingBar.complete();
            $scope.logo = result.logo;
            $scope.title = result.title;
            $scope.content = result.content;
            $scope.pledged = result.pledged;
            $scope.symbol = result.symbol;
            $scope.goal = result.goal;
            $scope.startTime = result.startTime;
            $scope.endTime = result.endTime;
            backData = result;
        });

        $scope.add = function(){
            var startTime = 0, endTime = 0;
            if (typeof $scope.startTime == 'number')
                startTime = $scope.startTime;
            else
                startTime = $scope.startTime.getTime();
            if (typeof $scope.endTime == 'number')
                endTime = $scope.endTime;
            else
                endTime = $scope.endTime.getTime();
            $http.post(SERVER_BASE_URL+'/api/v3/crowdfunding/edit/'+$scope.id, {
                logo : $scope.logo,
                title : $scope.title,
                content : $scope.content,
                symbol : $scope.symbol,
                goal : $scope.goal,
                startTime : startTime,
                endTime : endTime
            }).success(function(result){
                Logger.logSuccess('众筹修改成功');
                $location.path('/crowdfunding/myProject');
            });
        };
    });
    app.controller('MarketController', function($scope, $location, $state){
    });
    //交易市场 虚拟币
    app.controller('MarketCoinController', function($scope, $http, $stateParams, $interval, $location, cfpLoadingBar, Logger) {
        $scope.coin = $stateParams.coin || 'DarkNetCoin';
        require([
            'highstock'
        ], function(){
            $scope.myOrders = [];
            function refresh_buy(field){
                var amount =  share.toNumber($scope.buyAmount);
                var price = share.toNumber($scope.buyPrice);
                var total = share.toNumber($scope.buyTotal);
                if (field == 'buyAmount' || field == 'buyPrice')
                {
                    total = amount*price;
                    $scope.buyTotal = total.toFixed(8);
                }
                else if (field == 'buyTotal')
                {
                    amount = share.toNumber(total/price).toFloat();
                    $scope.buyAmount = amount;
                }
                var fee = share.toNumber(total*$scope.fee);
                $scope.buyFee = fee.toFloat();
                $scope.buyNetTotal = (total + fee).toFloat();
            }
            function refresh_sell(field){
                var amount =  share.toNumber($scope.sellAmount);
                var price = share.toNumber($scope.sellPrice);
                var total = share.toNumber($scope.sellTotal);
                if (field == 'sellAmount' || field == 'sellPrice')
                {
                    total = amount*price;
                    $scope.sellTotal = total.toFixed(8);
                }
                else if (field == 'sellTotal')
                {
                    amount = share.toNumber(total/price).toFloat();
                    $scope.sellAmount = amount;
                }
                var fee = share.toNumber(total*$scope.fee);
                $scope.sellFee = fee.toFloat();
                $scope.sellNetTotal = (total - fee).toFloat();
            }
            $scope.$watch('buyAmount', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyAmount');
            });
            $scope.$watch('buyPrice', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyPrice');
            });
            $scope.$watch('buyTotal', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyTotal');
            });
            $scope.$watch('sellAmount', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellAmount');
            });
            $scope.$watch('sellPrice', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellPrice');
            });
            $scope.$watch('sellTotal', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellTotal');
            });
            $scope.getMarketInfo = function(){
                //获取当前币种市场信息
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/'+$scope.coin).success(function(result) {
                    //$scope.coin = result.coin;
                    $scope.coinLastPrice = result.lastPrice;
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    $scope.todayTradInfo = result.todayTradInfo;
                    $scope.fee = result.fee;
                });
            };
            $scope.getMyOrder = function(){
                if (!$scope.isAuthenticated()) return;
                //获取我的订单
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/getMyOrder/'+$scope.coin).success(function(result) {
                    $scope.myOrders = result.myOrder;
                    $scope.myHistory = result.myHistory;
                    if (result.buyBalance)
                        $scope.buyBalance = result.buyBalance;
                    if (result.sellBalance)
                        $scope.sellBalance = result.sellBalance;
                });
            };
            $scope.getBuyOrder = function(){
                //获取买单
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/getBuyOrder/'+$scope.coin).success(function(result) {
                    $scope.myBuyOrders = [];
                    for (var i = 0; i < result.length; i++){
                        var item = result[i];
                        if (i == 0)
                        {
                            var price = share.toNumber($scope.sellPrice);
                            if (price == 0)
                                $scope.sellPrice = item.price.toFixed(8);
                        }
                        $scope.myBuyOrders.push({price:item.price, amount:item.amount});
                    }
                });
            };
            $scope.getSellOrder = function(){
                //获取卖单
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/getSellOrder/'+$scope.coin).success(function(result) {
                    $scope.mySellOrders = [];
                    for (var i = 0; i < result.length; i++){
                        var item = result[i];
                        if (i == 0)
                        {
                            var price = share.toNumber($scope.buyPrice);
                            if (price == 0)
                                $scope.buyPrice = item.price.toFixed(8);
                        }
                        $scope.mySellOrders.push({price:item.price, amount:item.amount});
                    }
                });
            };
            $scope.getAllOrder = function(){
                //获取所有完成的订单
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/getAllOrder/'+$scope.coin).success(function(result) {
                    $scope.allOrders = result;
                });
            };
            $scope.getMarkets = function(){
                //获取全部市场信息
                $http.get(SERVER_BASE_URL+'/api/v3/market/coin/getMarkets').success(function(result) {
                    var lastPrices = result.lastPrices;
                    var yesterdayLastPrices = result.yesterdayLastPrices;
                    var htmlList = [];
                    for (var coin in lastPrices){
                        var classStr = '';
                        var price = lastPrices[coin];
                        price = parseFloat(price);
                        var change = share.toNumber((price - yesterdayLastPrices[coin])/yesterdayLastPrices[coin]*100);
                        var color = '';
                        if (change == 0)
                            color = 'none';
                        else if (change > 0)
                            color = 'green';
                        else if (change < 0)
                            color = 'red';
                        var style = '';
                        if (lastPrices[coin].offline)
                            style = "background-color: #E9EAEA;";
                        htmlList.push({coin:coin, style:style, color:color, price:price, change:change});
                    }
                    $scope.markets = htmlList;
                });
            };

            //下订单
            $scope.trade = function(type)
            {
                var amount = eval('$scope.'+type+'Amount');
                var price = eval('$scope.'+type+'Price');
                var fromCoin;
                var toCoin;
                if (type == 'buy')
                {
                    fromCoin = 'BitCoin';
                    toCoin = $scope.coin;
                }
                else
                {
                    toCoin = 'BitCoin';
                    fromCoin = $scope.coin;
                }
                $http.post(SERVER_BASE_URL+'/api/v3/market/coin/trade/'+type, {amount:amount, price:price, fromCoin:fromCoin, toCoin:toCoin}).success(function(result) {
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    Logger.logSuccess('Order created successfully');
                    $scope.getMyOrder();
                    if (type == 'buy')
                        $scope.getBuyOrder();
                    else
                        $scope.getSellOrder();
                }).error(function(result){
                    Logger.logError(result.message);
                });
            };
            //取消定单
            $scope.cancleOrder = function(id){
                cfpLoadingBar.start();
                $http.post(SERVER_BASE_URL+'/api/v3/market/coin/cancleOrder', {id:id}).success(function(result) {
                    cfpLoadingBar.complete();
                    _.remove($scope.myOrders, {id:id});
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    Logger.logSuccess('Order canceled successfully');
                }).error(function(result){
                    cfpLoadingBar.complete();
                    Logger.logError(result.message);
                });
            };

            function tradeLine(result)
            {
                var OptionsLange = {};
                OptionsLange['zh-CN'] = {
                    months:['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    shortMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
                    price:'价格',
                    volume:'成交量'
                };
                OptionsLange['en'] = {
                    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    price:'Price',
                    volume:'Volume'
                };
                var i18next = $.cookie('i18next');
                if (i18next != 'zh-CN')
                    i18next = 'en';
                var trade_day_line = eval(result);
                var datas = trade_day_line;
                var rates = [];
                var vols = [];
                var ma5 = [];
                var ma20 = [];
                for (var i = 0; i < datas.length; i++) {
                    rates.push([
                        datas[i][0],
                        datas[i][2],
                        datas[i][3],
                        datas[i][4],
                        datas[i][5]
                    ]);

                    vols.push([
                        datas[i][0],
                        datas[i][1]
                    ]);

                    //      var temp5 = ((parseFloat(datas[i][4]) + parseFloat(datas[i - 1][4]) + parseFloat(datas[i - 2][4]) + parseFloat(datas[i - 3][4]) + parseFloat(datas[i - 4][4])) + (parseFloat(datas[i][3]) + parseFloat(datas[i - 1][3]) + parseFloat(datas[i - 2][3]) + parseFloat(datas[i - 3][3]) + parseFloat(datas[i - 4][3]))) / 10;
                    //       ma5.push([datas[i][0], temp5]);

                    //       var temp20 = ((parseFloat(datas[i][4]) + parseFloat(datas[i - 1][4]) + parseFloat(datas[i - 2][4]) + parseFloat(datas[i - 3][4]) + parseFloat(datas[i - 4][4]) + parseFloat(datas[i - 5][4]) + parseFloat(datas[i - 6][4]) + parseFloat(datas[i - 7][4]) + parseFloat(datas[i - 8][4]) + parseFloat(datas[i - 9][4]) + parseFloat(datas[i - 10][4]) + parseFloat(datas[i - 11][4]) + parseFloat(datas[i - 12][4]) + parseFloat(datas[i - 13][4]) + parseFloat(datas[i - 14][4]) + parseFloat(datas[i - 15][4]) + parseFloat(datas[i - 16][4]) + parseFloat(datas[i - 17][4]) + parseFloat(datas[i - 18][4]) + parseFloat(datas[i - 19][4])) + (parseFloat(datas[i][3]) + parseFloat(datas[i - 1][3]) + parseFloat(datas[i - 2][3]) + parseFloat(datas[i - 3][3]) + parseFloat(datas[i - 4][3]) + parseFloat(datas[i - 5][3]) + parseFloat(datas[i - 6][3]) + parseFloat(datas[i - 7][3]) + parseFloat(datas[i - 8][3]) + parseFloat(datas[i - 9][3]) + parseFloat(datas[i - 10][3]) + parseFloat(datas[i - 11][3]) + parseFloat(datas[i - 12][3]) + parseFloat(datas[i - 13][3]) + parseFloat(datas[i - 14][3]) + parseFloat(datas[i - 15][3]) + parseFloat(datas[i - 16][3]) + parseFloat(datas[i - 17][3]) + parseFloat(datas[i - 18][3]) + parseFloat(datas[i - 19][3]))) / 40;
                    //        ma20.push([datas[i][0], temp20]);
                }

                Highcharts.setOptions({
                    colors: ['#DD1111', '#FF0000', '#DDDF0D', '#7798BF', '#55BF3B', '#DF5353', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
                    lang: {
                        loading: 'Loading...',
                        months: OptionsLange[i18next]['months'],
                        shortMonths: OptionsLange[i18next]['shortMonths'],
                        weekdays: OptionsLange[i18next]['weekdays'],
                        decimalPoint: '.',
                        numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],
                        resetZoom: 'Reset zoom',
                        resetZoomTitle: 'Reset zoom level 1:1',
                        thousandsSep: ','
                    },
                    credits: {enabled: false},
                    global: {useUTC: false}
                });
                var frameWith = $('#trade_main').innerWidth();
                var frameHeight = $('#trade_main').innerHeight();
                //, width: frameWith

                trade_day_line.main_chart = new Highcharts.StockChart({
                    chart: {renderTo: 'graphbox', width:frameWith-32, height:frameHeight-30},
                    xAxis: {type: 'datetime'},
                    legend: {enabled: false},
                    plotOptions: {candlestick: {color: '#f01717', upColor: '#0ab92b'}},
                    tooltip: {xDateFormat: '%Y-%m-%d %H:%M %A', color: '#f0f', changeDecimals: 8, borderColor: '#058dc7'},
                    scrollbar: {enabled: false},
                    navigator: {enabled: false},
                    rangeSelector: {enabled: false},
                    yAxis: [
                        {top: 35, height: 193, labels: {style: {color: '#CC3300'}}, title: {text: OptionsLange[i18next]['price'], style: {color: '#CC3300'}}, allowDecimals:true, gridLineDashStyle: 'Dash'},
                        {top: 228, height: 70, labels: {style: {color: '#4572A7'}}, title: {text: OptionsLange[i18next]['volume'], style: {color: '#4572A7'}}, gridLineDashStyle: 'Dash', offset: 0}
                    ],
                    series: [
                        //{name: 'MA5', data: ma5, type: 'spline', threshold: null, tooltip: {valueDecimals: 8}, color: '#FF00FF', lineWidth: 1},
                        // {name: 'MA20', data: ma20, type: 'spline', threshold: null, tooltip: {valueDecimals: 8}, color: '#4572A7', lineWidth: 1},
                        {animation: false, name: OptionsLange[i18next]['volume'], type: 'column', color: '#4572A7', marker: {enabled: false}, yAxis: 1, data: vols},
                        {animation: false, name: OptionsLange[i18next]['price'], type: 'candlestick', tooltip: {valueDecimals: 8}, marker: {enabled: false}, data: rates}
                    ]
                });
            }
            $scope.getDayLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/coin/getTradeDayLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            }

            //获取K线
            $scope.getTimeLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/coin/getTradeTimeLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            };

            $scope.get5minLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/coin/getTrade5minLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            };

            $scope.getMarketInfo();
            $scope.getTimeLine();
            $scope.getMarkets();
            $scope.getMyOrder();
            $scope.getBuyOrder();
            $scope.getSellOrder();
            $scope.getAllOrder();

            $scope.changeCoin = function(coin)
            {
                $scope.sellPrice = '';
                $scope.buyPrice = '';
                $scope.coin = coin;
                $scope.getMarketInfo();
                $scope.getTimeLine();
                $scope.getMarkets();
                $scope.getMyOrder();
                $scope.getBuyOrder();
                $scope.getSellOrder();
                $scope.getAllOrder();
            };

            //定时获取市场信息 1分钟一次
            var marketInfoTimer = $interval(function(){
                $scope.getMarketInfo();
                $scope.getMarkets();
            }, 5*60*1000);
            //10秒获取一次订单信息
            var marketTimer = $interval(function(){
                $scope.getMyOrder();
                $scope.getBuyOrder();
                $scope.getSellOrder();
                $scope.getAllOrder();
            }, 10*1000);
            //5分钟获取K线
            var timeLineTimer = $interval(function(){
                $scope.getTimeLine();
            }, 5*60*1000);

            //离开时关闭定时器
            $scope.$on('$destroy', function() {
                $interval.cancel(marketInfoTimer);
                $interval.cancel(marketTimer);
                $interval.cancel(timeLineTimer);
            });
        });
    });
    app.controller('MarketMyOrderController', function($scope, $http, $auth, $location, cfpLoadingBar, Logger){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        $scope.currentPage = 1;
        $scope.$watch('currentPage', function() {
            cfpLoadingBar.start();
            $http.get(SERVER_BASE_URL+'/api/v3/market/getMyOrders?p='+$scope.currentPage).success(function(result){
                cfpLoadingBar.complete();
                $scope.resultList = result.resultList;
                $scope.totalItems = result.totalItems;
            });
        });

        $scope.cancleOrder = function(id)
        {
            cfpLoadingBar.start();
            $http.post(SERVER_BASE_URL+'/api/v3/market/coin/cancleOrder', {id:id}).success(function(result){
                cfpLoadingBar.complete();
                _.remove($scope.resultList, {id:id});
                Logger.logSuccess('Order canceled successfully');
            }).error(function(result){
                Logger.logError(result.message);
            });
        };
    });
    app.controller('MarketTradeHistoryController', function($scope, $http, $auth, $location, cfpLoadingBar){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        $scope.currentPage = 1;
        $scope.$watch('currentPage', function() {
            cfpLoadingBar.start();
            $http.get(SERVER_BASE_URL+'/api/v3/market/getTradeHistorys?p='+$scope.currentPage).success(function(result){
                cfpLoadingBar.complete();
                $scope.resultList = result.resultList;
                $scope.totalItems = result.totalItems;
            });
        });
    });
    app.controller('MarketStockListController', function($scope, $http, cfpLoadingBar){
        cfpLoadingBar.start();
        $http.get(SERVER_BASE_URL+'/api/v3/market/stock').success(function(result){
            cfpLoadingBar.complete();
            $scope.resultList = result;
        });
    });
    app.controller('MarketStockController', function($scope, $http, $stateParams, $interval, $location, cfpLoadingBar, Logger){
        $scope.coin = $stateParams.coin;
        require([
            'highstock'
        ], function(){
            //var fullName = share.coinToFullName($scope.coin);
            //$scope.fullName = Coins[$scope.coin].fullName;
            $scope.myOrders = [];
            function refresh_buy(field){
                var amount =  share.toNumber($scope.buyAmount);
                var price = share.toNumber($scope.buyPrice);
                var total = share.toNumber($scope.buyTotal);
                if (field == 'buyAmount' || field == 'buyPrice')
                {
                    total = amount*price;
                    $scope.buyTotal = total.toFixed(8);
                }
                else if (field == 'buyTotal')
                {
                    amount = share.toNumber(total/price).toFloat();
                    $scope.buyAmount = amount;
                }
                var fee = share.toNumber(total*$scope.fee);
                $scope.buyFee = fee.toFloat();
                $scope.buyNetTotal = (total + fee).toFloat();
            }
            function refresh_sell(field){
                var amount =  share.toNumber($scope.sellAmount);
                var price = share.toNumber($scope.sellPrice);
                var total = share.toNumber($scope.sellTotal);
                if (field == 'sellAmount' || field == 'sellPrice')
                {
                    total = amount*price;
                    $scope.sellTotal = total.toFixed(8);
                }
                else if (field == 'sellTotal')
                {
                    amount = share.toNumber(total/price).toFloat();
                    $scope.sellAmount = amount;
                }
                var fee = share.toNumber(total*$scope.fee);
                $scope.sellFee = fee.toFloat();
                $scope.sellNetTotal = (total - fee).toFloat();
            }
            $scope.$watch('buyAmount', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyAmount');
            });
            $scope.$watch('buyPrice', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyPrice');
            });
            $scope.$watch('buyTotal', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_buy('buyTotal');
            });
            $scope.$watch('sellAmount', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellAmount');
            });
            $scope.$watch('sellPrice', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellPrice');
            });
            $scope.$watch('sellTotal', function(newVal, oldVal) {
                if (newVal === oldVal) { return; }
                refresh_sell('sellTotal');
            });
            $scope.getMarketInfo = function(){
                //获取当前币种市场信息
                $http.get(SERVER_BASE_URL+'/api/v3/market/stock/'+$scope.coin).success(function(result) {
                    //$scope.coin = result.coin;
                    $scope.lastPrice = result.lastPrice;
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    $scope.todayTradInfo = result.todayTradInfo;
                    $scope.fee = result.fee;
                });
            };
            $scope.getMyOrder = function(){
                if (!$scope.isAuthenticated()) return;
                //获取我的订单
                $http.get(SERVER_BASE_URL+'/api/v3/market/stock/getMyOrder/'+$scope.coin).success(function(result) {
                    $scope.myOrders = result.myOrder;
                    $scope.myHistory = result.myHistory;
                    if (result.buyBalance)
                        $scope.buyBalance = result.buyBalance;
                    if (result.sellBalance)
                        $scope.sellBalance = result.sellBalance;
                });
            };
            $scope.getBuyOrder = function(){
                //获取买单
                $http.get(SERVER_BASE_URL+'/api/v3/market/stock/getBuyOrder/'+$scope.coin).success(function(result) {
                    $scope.myBuyOrders = [];
                    for (var i = 0; i < result.length; i++){
                        var item = result[i];
                        if (i == 0)
                        {
                            var price = share.toNumber($scope.sellPrice);
                            if (price == 0)
                                $scope.sellPrice = item.price.toFixed(8);
                        }
                        $scope.myBuyOrders.push({price:item.price, amount:item.amount});
                    }
                });
            };
            $scope.getSellOrder = function(){
                //获取卖单
                $http.get(SERVER_BASE_URL+'/api/v3/market/stock/getSellOrder/'+$scope.coin).success(function(result) {
                    $scope.mySellOrders = [];
                    for (var i = 0; i < result.length; i++){
                        var item = result[i];
                        if (i == 0)
                        {
                            var price = share.toNumber($scope.buyPrice);
                            if (price == 0)
                                $scope.buyPrice = item.price.toFixed(8);
                        }
                        $scope.mySellOrders.push({price:item.price, amount:item.amount});
                    }
                });
            };
            $scope.getAllOrder = function(){
                //获取所有完成的订单
                $http.get(SERVER_BASE_URL+'/api/v3/market/stock/getAllOrder/'+$scope.coin).success(function(result) {
                    $scope.allOrders = result;
                });
            };

            //下订单
            $scope.trade = function(type)
            {
                var amount = eval('$scope.'+type+'Amount');
                var price = eval('$scope.'+type+'Price');
                var fromCoin;
                var toCoin;
                if (type == 'buy')
                {
                    fromCoin = 'BitCoin';
                    toCoin = $scope.coin;
                }
                else
                {
                    toCoin = 'BitCoin';
                    fromCoin = $scope.coin;
                }
                $http.post(SERVER_BASE_URL+'/api/v3/market/stock/trade/'+type, {amount:amount, price:price, fromCoin:fromCoin, toCoin:toCoin}).success(function(result) {
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    Logger.logSuccess('Order created successfully');
                    $scope.getMyOrder();
                    if (type == 'buy')
                        $scope.getBuyOrder();
                    else
                        $scope.getSellOrder();
                }).error(function(result){
                    Logger.logError(result.message);
                });
            };
            //取消定单
            $scope.cancleOrder = function(id){
                cfpLoadingBar.start();
                $http.post(SERVER_BASE_URL+'/api/v3/market/stock/cancleOrder', {id:id}).success(function(result) {
                    cfpLoadingBar.complete();
                    _.remove($scope.myOrders, {id:id});
                    //var item;
                    //for (var i = 0; i < $scope.myOrders; i++)
                    //{
                    //    item = $scope.myOrders[i];
                    //    if (item.id == id)
                    //        $scope.myOrders.remove(item);
                    //}
                    $scope.buyBalance = result.buyBalance;
                    $scope.sellBalance = result.sellBalance;
                    Logger.logSuccess('Order canceled successfully');
                }).error(function(result){
                    cfpLoadingBar.complete();
                    Logger.logError(result.message);
                });
            };

            function tradeLine(result)
            {
                var OptionsLange = {};
                OptionsLange['zh-CN'] = {
                    months:['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    shortMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
                    price:'价格',
                    volume:'成交量'
                };
                OptionsLange['en'] = {
                    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    price:'Price',
                    volume:'Volume'
                };
                var i18next = $.cookie('i18next');
                if (i18next != 'zh-CN')
                    i18next = 'en';
                var trade_day_line = eval(result);
                var datas = trade_day_line;
                var rates = [];
                var vols = [];
                var ma5 = [];
                var ma20 = [];
                for (var i = 0; i < datas.length; i++) {
                    rates.push([
                        datas[i][0],
                        datas[i][2],
                        datas[i][3],
                        datas[i][4],
                        datas[i][5]
                    ]);

                    vols.push([
                        datas[i][0],
                        datas[i][1]
                    ]);
                }

                Highcharts.setOptions({
                    colors: ['#DD1111', '#FF0000', '#DDDF0D', '#7798BF', '#55BF3B', '#DF5353', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
                    lang: {
                        loading: 'Loading...',
                        months: OptionsLange[i18next]['months'],
                        shortMonths: OptionsLange[i18next]['shortMonths'],
                        weekdays: OptionsLange[i18next]['weekdays'],
                        decimalPoint: '.',
                        numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],
                        resetZoom: 'Reset zoom',
                        resetZoomTitle: 'Reset zoom level 1:1',
                        thousandsSep: ','
                    },
                    credits: {enabled: false},
                    global: {useUTC: false}
                });
                var frameWith = $('#trade_main').innerWidth();
                var frameHeight = $('#trade_main').innerHeight();
                //, width: frameWith

                trade_day_line.main_chart = new Highcharts.StockChart({
                    chart: {renderTo: 'graphbox', width:frameWith-32, height:frameHeight-30},
                    xAxis: {type: 'datetime'},
                    legend: {enabled: false},
                    plotOptions: {candlestick: {color: '#f01717', upColor: '#0ab92b'}},
                    tooltip: {xDateFormat: '%Y-%m-%d %H:%M %A', color: '#f0f', changeDecimals: 8, borderColor: '#058dc7'},
                    scrollbar: {enabled: false},
                    navigator: {enabled: false},
                    rangeSelector: {enabled: false},
                    yAxis: [
                        {top: 35, height: 193, labels: {style: {color: '#CC3300'}}, title: {text: OptionsLange[i18next]['price'], style: {color: '#CC3300'}}, allowDecimals:true, gridLineDashStyle: 'Dash'},
                        {top: 228, height: 70, labels: {style: {color: '#4572A7'}}, title: {text: OptionsLange[i18next]['volume'], style: {color: '#4572A7'}}, gridLineDashStyle: 'Dash', offset: 0}
                    ],
                    series: [
                        //{name: 'MA5', data: ma5, type: 'spline', threshold: null, tooltip: {valueDecimals: 8}, color: '#FF00FF', lineWidth: 1},
                        // {name: 'MA20', data: ma20, type: 'spline', threshold: null, tooltip: {valueDecimals: 8}, color: '#4572A7', lineWidth: 1},
                        {animation: false, name: OptionsLange[i18next]['volume'], type: 'column', color: '#4572A7', marker: {enabled: false}, yAxis: 1, data: vols},
                        {animation: false, name: OptionsLange[i18next]['price'], type: 'candlestick', tooltip: {valueDecimals: 8}, marker: {enabled: false}, data: rates}
                    ]
                });
            }
            $scope.getDayLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/stock/getTradeDayLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            };

            //获取K线
            $scope.getTimeLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/stock/getTradeTimeLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            };

            $scope.get5minLine = function ()
            {
                var url = SERVER_BASE_URL+"/api/v3/market/stock/getTrade5minLine/"+$scope.coin+"?" + Math.random();
                $http.get(url).success(function(result) {
                    tradeLine(result);
                });
            };

            $scope.getMarketInfo();
            $scope.getTimeLine();
            $scope.getMyOrder();
            $scope.getBuyOrder();
            $scope.getSellOrder();
            $scope.getAllOrder();

            $scope.changeCoin = function(coin)
            {
                $scope.coin = coin;
                $scope.getMarketInfo();
                $scope.getTimeLine();
                $scope.getMyOrder();
                $scope.getBuyOrder();
                $scope.getSellOrder();
                $scope.getAllOrder();
            };

            //定时获取市场信息 1分钟一次
            var marketInfoTimer = $interval(function(){
                $scope.getMarketInfo();
            }, 5*60*1000);
            //10秒获取一次订单信息
            var marketTimer = $interval(function(){
                $scope.getMyOrder();
                $scope.getBuyOrder();
                $scope.getSellOrder();
                $scope.getAllOrder();
            }, 10*1000);
            //5分钟获取K线
            var timeLineTimer = $interval(function(){
                $scope.getTimeLine();
            }, 5*60*1000);

            //离开时关闭定时器
            $scope.$on('$destroy', function() {
                $interval.cancel(marketInfoTimer);
                $interval.cancel(marketTimer);
                $interval.cancel(timeLineTimer);
            });
        });
    });
    app.controller('BlackJackController', function($scope, $http, $auth, $location, socket) {
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        require([
                'phaser',
                'poker',
                '/games/blackjack/js/blackjack.js'
            ],
            function(phaser, poker, BlackJack){
                $scope.isFullScreen = false;
                $scope.clickCoinLogo = function(){
                    socket.emit('coin', $scope.coin);
                };
                $scope.home = function(){
                    $location.path('/');
                };
                $scope.screen = function(){
                    if (!$scope.isFullScreen)
                    {
                        if (requestFullScreen())
                            $scope.isFullScreen = true;
                    }
                    else
                    {
                        if (exitFullscreen())
                            $scope.isFullScreen = false;
                    }
                };

                $scope.exit = function(){
                    socket.emit('exit', null);
                };

                // var blackjack = new BlackJack(socket);
                var w = $('#BlackJack').innerWidth();
                var h = $('#BlackJack').innerHeight();
                var game = new Phaser.Game(w, h, Phaser.CANVAS, 'BlackJack');
                game.socket = socket;
                game.isStopSound = false;
                game.audio_music = null;
                // add game states
                game.state.add('Boot', BlackJack.Boot);
                game.state.add('Preloader', BlackJack.Preloader);
                game.state.add('MainMenu', BlackJack.MainMenu);
                // start the Boot state
                game.state.start('Boot');

                $scope.sound = function(){
                    game.isStopSound = !game.isStopSound;
                    if (game.isStopSound)
                    {
                        $('.sound').css('background-position', '-96px 0');
                        game.audio_music.pause();
                    }
                    else
                    {
                        $('.sound').css('background-position', '-48px 0');
                        game.audio_music.resume();
                    }
                };
                $scope.fair = function(){
                    if ($('.fairBox').is(':visible') == false)
                        socket.emit('getSeed', null);
                    else
                        $('.fairBox').fadeOut(256);
                };

                $scope.$on('$destroy', function() {
                    socket.disconnect();
                    game.destroy();
                });
            }
        );
    });
    app.controller('DiceController', function($scope, $modal, $auth, $location, cfpLoadingBar, socket){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        require([
                'coins',
                'toastr',
                '/games/dice/dice.js'
            ],
            function(c, toastr, dice){
                $scope.roll = function(id){
                    var modalInstance = $modal.open({
                        templateUrl: '/views/games/dice_roll.html',
                        controller: 'DiceRollController',
                        resolve : {
                            id : function(){
                                return id;
                            },
                            socket : function(){
                                return socket;
                            }
                        }
                    });
                };
                $scope.resultList = [];
                $scope.myResultList = [];
                dice.initUi(toastr, cfpLoadingBar, socket, $scope);
                $scope.clickCoinLogo = function(){
                    //cfpLoadingBar.start();
                    dice.ChangeCoin($scope.coin);
                };
                $scope.$on('$destroy', function() {
                    socket.disconnect();
                });
            }
        );
    });
    app.controller('DiceRollController', function($scope, $http, $modalInstance, Logger, id, socket){
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        socket.on('roll:result', function(data){
           if (data.err) return Logger.logError(data.err);
            $scope.result = data.result;
        });
        socket.emit('roll', id);
        $scope.$on('$destroy', function() {
            socket.removeListener('roll:result');
        });
    });
    app.controller('HorseController', function($scope, $auth, $location, cfpLoadingBar, socket){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        require([
                //'/public/lib/phaser-2.0.6.min.js',
                '/public/lib/sha256.js',
                '/public/lib/hmac-sha512.js',
                //'/public/lib/enc-base64-min.js',
                '/games/horse/horse.js'
            ],
            function(){
                var w = $('#Horse').innerWidth();
                var h = $('#Horse').innerHeight();
                var game = new Phaser.Game(w, h, Phaser.CANVAS, 'Horse');
                game.socket = socket;
                // add game states
                game.state.add('Boot', Horse.Boot);
                game.state.add('Preloader', Horse.Preloader);
                game.state.add('MainMenu', Horse.MainMenu);
                // start the Boot state
                game.state.start('Boot');

                //赛马列表
                //$scope.horseList = [
                //    {id:1, name:'超人', age:3, winRate:40, odds:4, wager:10},
                //    {id:2, name:'穿云箭', age:3, winRate:40, odds:4, wager:0},
                //    {id:3, name:'喜洋洋', age:3, winRate:40, odds:4, wager:0},
                //    {id:4, name:'军歌', age:3, winRate:40, odds:4, wager:0},
                //    {id:5, name:'火箭', age:3, winRate:40, odds:4, wager:0},
                //    {id:6, name:'无敌', age:3, winRate:40, odds:4, wager:0},
                //];
                $scope.bet1 = function(){
                    $scope.wager1 = $scope.input1;
                };
                $scope.startGame = function(){
                    game.horse.Start();
                };

                $scope.$on('$destroy', function() {
                    socket.disconnect();
                });
            }
        );
    });
    app.controller('HoldemController', function($scope, $auth, $location, $translate, cfpLoadingBar, socket){
        if (!$auth.isAuthenticated())
            return $location.path('/login');
        //require([
        //        '/public/games/holdem/js/share.js',
        //        '/public/games/holdem/js/holdem2.js',
        //        '/public/lib/poker.min.js',
        //        '/public/lib/jQueryRotate.js',
        //        '/public/lib/rotate3Di/jquery-css-transform/jquery-css-transform.js',
        //        '/public/lib/rotate3Di/rotate3Di.js',
        //        '/public/lib/rating/rating.min.js',
        //        '/public/lib/nanoscroller/jquery.nanoscroller.min.js',
        //        '/public/lib/cprogress/jCProgress-1.0.3.js'
        //    ],
        //    function(share, holdem){
        //        var h = new holdem(socket, $translate);
        //        h.Loading();
        //
        //        $scope.$on('$destroy', function() {
        //            socket.disconnect();
        //        });
        //    }
        //);
        require([
                '/games/holdem/js/holdem.js'
            ],
            function(holdem){
                var w = $('#HoldemFrame').innerWidth();
                var h = $('#HoldemFrame').innerHeight();
                var game = new Phaser.Game(w, h, Phaser.CANVAS, 'Holdem');
                game.socket = socket;
                game.$translate = $translate;
                // add game states
                game.state.add('Boot', holdem.Boot);
                game.state.add('Preloader', holdem.Preloader);
                game.state.add('MainMenu', holdem.MainMenu);
                // start the Boot state
                game.state.start('Boot');


                $scope.$on('$destroy', function() {
                    socket.disconnect();
                    game.destroy();
                });
            }
        );
    });
});