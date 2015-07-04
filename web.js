var express = require('express')
    , path = require('path')
    , app = express()
    , server = require('http').createServer(app);

app.set('port', process.env.PORT || 80);
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, './client-web')));

if (app.get('env') === 'development') {
    //app.use(express.errorHandler());
}

// angular启动页
app.get('/', function (req, res) {
    res.sendfile('client-web/index.html');
});

server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});