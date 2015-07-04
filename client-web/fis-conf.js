//开启autoCombine可以将零散资源进行自动打包
// fis.config.set('settings.postpackager.simple.autoCombine', true);
//自动将页面中独立的资源引用替换为打包资源
// fis.config.set('modules.postpackager', 'simple');
fis.config.merge({
    modules:{
        postprocessor: {
            tpl: 'amd', // 如果你的模板是.tpl结尾的模板，如 Smarty、Swig 模板
            js: 'amd',
            html: 'amd' // 如果你的项目中也有一些 html 文件需要使用 AMD
        } 
    } 
});
//export, module, require不压缩变量名
fis.config.set('settings.optimizer.uglify-js', {
    mangle: {
        except: 'exports, module, require, define'
    }
});

//自动去除console.log等调试信息
fis.config.set('settings.optimizer.uglify-js', {
    compress : {
        drop_console: true
    }
});

fis.config.set('pack', {
    '/pkg/lib.js': [
	    '/public/coins.js',
	    '/public/share.js',
        '/js/config.js',
	    // '/js/public.js',
	    '/js/site.js',
        '/js/app.js',
        '/js/router.js',
        '/js/filters.js',
        '/js/directives.js',
        '/js/services.js',
        '/js/controllers.js',
    ]
});