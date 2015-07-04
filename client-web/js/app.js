
define(["angular"], function(angular){
    var app = angular.module("CoinGame", ['ngMessages', 'ui.router', 'ui.bootstrap', 'angular-loading-bar', 'satellizer', 'ui.select', 'ngSanitize', 'ui.tinymce', 'ngCookies', 'pascalprecht.translate']);
    app.config(function(cfpLoadingBarProvider) {
        cfpLoadingBarProvider.includeSpinner = true;
    });
    app.config(function($translateProvider) {
        $translateProvider.useStaticFilesLoader({prefix: "i18n/",suffix: ".json"});
        $translateProvider.useLocalStorage();
        $translateProvider.preferredLanguage("en-US");
        $translateProvider.useSanitizeValueStrategy('escaped');
    });
    return app;
});