const path = require('path');
const webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');


function makeWebpackConfig (options) {

  var BUILD = !!options.BUILD;

  /**
   * Config
   * This is the object where all configuration gets set
   */
  var config = {
    entry: "./app/components/App",
    resolve: {
      modulesDirectories: ["app", "node_modules"],
      extensions: ['', '.css','.ejs', '.js']
    },
    output: {
      path: __dirname+"/public/assets",
      filename: "bundle.js",
    },
    module: {
      loaders: [
        { test: /\.(ttf|eot|svg|png|jpg|jpeg|gif|woff|woff2)(\?.*$|$)/, loader: "file-loader" },
        {
          test: /\.js$/,
          include: [
            path.resolve(__dirname, "app"),
          ],
          loader: "babel-loader"
        },
        {test: /\.ejs$/, loader: 'ejs-compiled'},
        { test: /\.css$/, loader : BUILD ? ExtractTextPlugin.extract('style', 'css?sourceMap') : "style-loader?sourceMap!css-loader?sourceMap"}
      ]
    },
    plugins: [
      new ExtractTextPlugin('[name].css'),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery"
      }),
      new webpack.ProvidePlugin({
        _: "underscore"
      })
    ]
  };

  if (BUILD) {
    config.devtool = 'source-map';
  } else {
    config.devtool = 'eval';
  }

  if(!BUILD)
    config.output.publicPath = "http://local.capriza.com:3005/assets/"; // Development server

  return config;

}


module.exports = makeWebpackConfig({BUILD: process.env.BUILD == "true"});