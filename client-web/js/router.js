define(['app'], function (app) {
    'use strict';
    app.config(function ($stateProvider, $urlRouterProvider, $locationProvider, $authProvider) {
        $authProvider.loginUrl = SERVER_BASE_URL + '/auth/login';
        $authProvider.signupUrl = SERVER_BASE_URL + '/auth/signup';

        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: '/views/home.html'
            })
            .state('login', {
                url: '/login',
                templateUrl: '/views/login.html'
            })
            .state('signup', {
                url: '/signup',
                templateUrl: '/views/signup.html'
            })
            .state('recover', {
                url: '/recover/:code',
                controller : function($scope, $http, $stateParams, $location, Logger){
                    var code = $stateParams.code;
                    $http.post(SERVER_BASE_URL+'/recover', {code:code}).success(function(result){
                        Logger.logSuccess('Password is changed');
                        $location.path('/login');
                    }).error(function(result){
                        if (result.message) Logger.logError(result.message);
                        $location.path('/login');
                    })
                }
            })
            .state('loading', {
                templateUrl: '/views/user/loading.html'
            })
            .state("connecting", {
                url: "/connecting",
                templateUrl: "/views/connecting.html"
            })
            .state('profile', {
                url: '/profile',
                templateUrl: '/views/user/profile.html'
            })
            .state('security', {
                url: '/security',
                templateUrl: '/views/user/security.html'
            })
            .state('profile.two-factor-setup', {
                templateUrl: '/views/user/two-factor-setup.html'
            })
            .state('profile.two-factor-enable', {
                templateUrl: '/views/user/two-factor-enable.html'
            })
            .state('profile.two-factor-disable', {
                templateUrl: '/views/user/two-factor-disable.html'
            })
            .state('referrer',{
                url : '/referrer',
                templateUrl: '/views/user/referrer.html'
            })
            .state('referrer_userid',{
                url : '/r/:userid',
                controller : function($scope, $stateParams, $location){
                    $.cookie('referrer', $stateParams.userid, {path:'/'});
                    $location.path('/');
                }
            })
            .state('setting', {
                url: '/setting',
                templateUrl: '/views/user/setting.html'
            })
            .state('balances', {
                url: '/balances',
                templateUrl: '/views/user/balances.html'
            }).state('history-deposit', {
                url: '/history/deposit/:coin',
                templateUrl: '/views/user/deposit_history.html'
            }).state('history-withdraw', {
                url: '/history/withdraw/:coin',
                templateUrl: '/views/user/withdraw_history.html'
            }).state('history-transfer', {
                url: '/history/transfer/:coin',
                templateUrl: '/views/user/transfer_history.html'
            })
            .state('dividend', {
                url: '/dividend',
                templateUrl: '/views/user/dividend.html'
            })
            .state('investments', {
                url: '/investments',
                templateUrl: '/views/user/investments.html'
            })
            .state('siteBetHistory', {
                url: '/siteBetHistory',
                templateUrl: '/views/siteBetHistory.html'
            })
            .state('dailyStatistical', {
                url: '/dailyStatistical',
                templateUrl: '/views/dailyStatistical.html'
            })
            .state('marketcoin', {
                url: '/market/coin',
                views : {
                    '' : {
                        templateUrl: '/views/market/market.html'
                    },
                    'content@marketcoin' : {
                        templateUrl: '/views/market/coin_show.html'
                    }
                }
            })
            .state('marketcoin_myOrder', {
                url: '/market/myOrder',
                views : {
                    '' : {
                        templateUrl: '/views/market/market.html'
                    },
                    'content@marketcoin_myOrder' : {
                        templateUrl: '/views/market/myOrder.html',
                        controller : 'MarketMyOrderController'
                    }
                }
            })
            .state('marketcoin_tradeHistory', {
                url: '/market/tradeHistory',
                views : {
                    '' : {
                        templateUrl: '/views/market/market.html'
                    },
                    'content@marketcoin_tradeHistory' : {
                        templateUrl: '/views/market/tradeHistory.html',
                        controller : 'MarketTradeHistoryController'
                    }
                }
            })
            .state('marketstock', {
                url: '/market/stock',
                templateUrl: '/views/market/stock_list.html'
            })
            .state('marketstockshow', {
                url: '/market/stock/:coin',
                views : {
                    '' : {
                        templateUrl: '/views/market/market.html'
                    },
                    'content@marketstockshow' : {
                        templateUrl: '/views/market/stock_show.html'
                    }
                }
            })
            .state('crowdfunding', {
                url: '/crowdfunding',
                views: {
                    '': {
                        templateUrl: '/views/crowdfunding/index.html'
                    },
                    'crowdfunding@crowdfunding': {
                        templateUrl: '/views/crowdfunding/list.html',
                        controller : 'CrowdfundingController'
                    }
                }
            })
            .state('crowdfunding_myInvestment', {
                url: '/crowdfunding/myInvestment',
                views: {
                    '': {
                        templateUrl: '/views/crowdfunding/index.html'
                    },
                    'crowdfunding@crowdfunding_myInvestment': {
                        templateUrl: '/views/crowdfunding/myInvestment.html',
                        controller : 'CrowdfundingMyInvestmentController'
                    }
                }
            })
            .state('crowdfunding_myProject', {
                url: '/crowdfunding/myProject',
                views: {
                    '': {
                        templateUrl: '/views/crowdfunding/index.html'
                    },
                    'crowdfunding@crowdfunding_myProject': {
                        templateUrl: '/views/crowdfunding/myProject.html',
                        controller : 'CrowdfundingMyProjectController'
                    }
                }
            })
            .state('crowdfunding_show', {
                url: '/crowdfunding/show/:id',
                templateUrl: '/views/crowdfunding/show.html'
            })
            .state('crowdfunding_add', {
                url: '/crowdfunding/add',
                views: {
                    '': {
                        templateUrl: '/views/crowdfunding/index.html'
                    },
                    'crowdfunding@crowdfunding_add': {
                        templateUrl: '/views/crowdfunding/add.html',
                        controller : 'CrowdfundingAddController'
                    }
                }
            })
            .state('crowdfunding_edit', {
                url: '/crowdfunding/edit/:id',
                views: {
                    '': {
                        templateUrl: '/views/crowdfunding/index.html'
                    },
                    'crowdfunding@crowdfunding_edit': {
                        templateUrl: '/views/crowdfunding/add.html',
                        controller : 'CrowdfundingEditController'
                    }
                }
            })
            .state('faqs', {
                url: '/faqs',
                templateUrl: '/views/faq.html'
            })
            .state('api', {
                url: '/api',
                templateUrl: '/views/api.html'
            })
            .state('developer', {
                url: '/developer',
                templateUrl: '/views/developer.html'
            })
            .state('agent', {
                url: '/agent',
                templateUrl: '/views/agent.html'
            })
            //游戏
            .state('blackjack', {
                url: '/games/blackjack',
                templateUrl: '/views/games/blackjack.html'
            })
            .state('dice', {
                url: '/games/dice',
                templateUrl: '/views/games/dice.html'
            })
            .state('horse', {
                url: '/games/horse',
                templateUrl: '/views/games/horse.html'
            })
            .state('holdem', {
                url: '/games/holdem',
                templateUrl: '/views/games/holdem.html'
            });

        $locationProvider.html5Mode(true).hashPrefix('!');
    });

    app.run(function($rootScope, $state) {
        $rootScope.$on("$stateChangeStart", function () {
        });
        $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
            $state.previous = fromState;
            $state.previousParams = fromParams
        });
    });
});