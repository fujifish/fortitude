var app = require('./server');
var routes = require('./routes/index');
var nodes = require('./routes/nodes');

app.use('/', routes);
app.use('/api', nodes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

module.exports = app;
