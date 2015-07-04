require.config({
    paths:{
        'domReady': '/public/lib/domready.min',
        //一些库文件
        'jquery': '/public/lib/jquery-2.0.3.min',
        'jquery.cookie': '/public/lib/jquery.cookie',
        'jquery.nicescroll': '/public/lib/jquery.nicescroll.min',

        'angular': '/public/lib/angularjs/angular.min',
        'angular-route': '/public/lib/angularjs/angular-ui-router',
        'angular-sanitize':'/public/lib/angularjs/angular-sanitize.min',  //ng-bind-html
        'angular-satellizer':'/public/lib/angularjs/satellizer.min',    //认识模块
        'angular-messages':'/public/lib/angularjs/angular-messages.min',
        'ui-bootstrap':'/public/lib/angularjs/ui-bootstrap-tpls.min',
        'ui-select':'/public/lib/ui-select/select.min',
        'angular-animate':'/public/lib/angularjs/angular-animate.min',
        'loading-bar':'/public/lib/loading-bar/loading-bar.min',
        'angular-tinymce':'/public/lib/angularjs/tinymce',
        'angular-cookies':'/public/lib/angularjs/angular-cookies.min',
        'angular-translate':'/public/lib/angularjs/angular-translate.min',
        'angular-translate-storage-local':'/public/lib/angularjs/angular-translate-storage-local.min',
        'angular-translate-storage-cookie':'/public/lib/angularjs/angular-translate-storage-cookie',
        'angular-translate-loader-static-files':'/public/lib/angularjs/angular-translate-loader-static-files.min',

        'phaser':'/public/lib/phaser.min',
        'nprogress':'/public/lib/nprogress/nprogress',
        'soundmanager2':'/public/lib/soundmanager2.min',
        'highstock':'/public/lib/highstock',
        'jQueryRotate':'/public/lib/jQueryRotate',
        'mousewheel':'/public/lib/jquery.mousewheel.min',
        'animate-css-rotate-scale':'/public/lib/jquery-animate-css-rotate-scale',
        'socket.io':'/public/lib/socket.io-1.2.1',
        'underscore':'/public/lib/underscore-min',
        'lodash':'/public/lib/lodash.min',
        'toastr':'/public/lib/toastr/toastr.min',
        'tinymce':'/public/lib/tinymce/tinymce.min',
        'poker':'/public/lib/poker.min',

        //js文件
        'bootstrap': "/js/bootstrap",

        //公共
        'coins' : '/public/coins',
        'share' : '/public/share',
        'snow' : '/public/lib/snow',

        'config' : '/public/config',
        'site' : '/js/site',
        'app': '/js/app',
        'router': '/js/router',
        'controllers' : '/js/controllers',
        'filters' : '/js/filters',
        'directives' : '/js/directives',
        'services' : '/js/services',
        
        'lib' : '/pkg/lib'
    },
    waitSeconds: 0,
    shim:{
        'angular':{
            exports:'angular'
        },
        'angular-route':{
            deps:['angular'],
            exports: 'angular-route'
        },
        'angular-sanitize':{
            deps:['angular'],
            exports: 'angular-sanitize'
        },
        'angular-satellizer':{
            deps:['angular'],
            exports: 'angular-satellizer'
        },
        'angular-animate':{
            deps:['angular'],
            exports: 'angular-animate'
        },
        'angular-cookies':{
            deps:['angular'],
            exports: 'angular-cookies'
        },
        'angular-messages':{
            deps:['angular'],
            exports: 'angular-messages'
        },
        'ui-bootstrap':{
            deps:['angular'],
            exports: 'ui-bootstrap'
        },
        'tinymce':{
            deps:['angular'],
            exports: 'tinymce'
        },
        'angular-tinymce':{
            deps:['tinymce'],
            exports: 'angular-tinymce'
        },
        'angular-translate':{
            deps:['angular'],
            exports: 'angular-translate'
        },
        'angular-translate-storage-local':{
            deps:['angular-translate-storage-cookie'],
            exports: 'angular-translate-storage-local'
        },
        'angular-translate-storage-cookie':{
            deps:['angular-translate'],
            exports: 'angular-translate-storage-cookie'
        },
        'angular-translate-loader-static-files':{
            deps:['angular-translate'],
            exports: 'angular-translate-loader-static-files'
        },
        'ui-select':{
            deps:['angular'],
            exports: 'ui-select'
        },
        'loading-bar':{
            deps:['angular'],
            exports: 'loading-bar'
        },
        'ngSocket':{
            deps:['angular'],
            exports: 'ngSocket'
        },
        jquery: {
            exports: 'jquery'
        },
        toastr: {
            deps: ['jquery'],
            exports: 'toastr'
        },
        'jquery.cookie': {
            deps: ['jquery'],
            exports: 'jquery.cookie'
        },
        'socketio': {
            exports: 'io'
        },
        'underscore': {
            exports: '_'
        },
        'phaser': {
            exports: 'Phaser'
        },
        'soundmanager2': {
            exports: 'soundmanager'
        },
        'site':{
            exports: 'site'
        }
    },
    deps:['bootstrap'],
    // urlArgs: "bust=" + localStorage.ver  //防止读取缓存，调试用
});