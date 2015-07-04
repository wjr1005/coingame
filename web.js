var express = require('express')
	, compress = require('compression')
    , path = require('path')
    , app = express()
    , server = require('http').createServer(app);

app.set('port', process.env.PORT || 80);
app.use(require('method-override')());
app.use(compress());
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