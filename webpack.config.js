const path = require('path');
const webpack = require('webpack');

module.exports = {
  // eval - Each module is executed with eval and //@ sourceURL.
  devtool: 'eval',

  entry: "./app/components/App",
  resolve: {
    modulesDirectories: ["app", "node_modules"],
//    root: path.resolve('./app'),
    extensions: ['', '.css','.ejs', '.js']
  },
  output: {
      path: __dirname+"/public/assets",
      filename: "bundle.js",
//        publicPath: "/assets/"
      publicPath: "http://local.capriza.com:3005/assets/", // Development server
  },
  module: {
      loaders: [
        { test: /\.(png|jpg|jpeg|gif)$/, loader: 'url-loader?limit=100000' },
        { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
        { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
        {
            test: /\.js$/,
            include: [
              path.resolve(__dirname, "app"),
            ],
            loader: "babel-loader"
          },
          {test: /\.ejs$/, loader: 'ejs-compiled'},
          { test: /\.css$/, loader : "style-loader?sourceMap!css-loader?sourceMap"}

      ]
  },
  plugins: [
			new webpack.ProvidePlugin({
    		$: "jquery",
    		jQuery: "jquery",
    		"window.jQuery": "jquery"
			})
		]	
};