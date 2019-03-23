const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const pathToPhaser = path.join(__dirname, "/node_modules/phaser/");
const phaser = path.join(pathToPhaser, "src/phaser.js");

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml)$/i,
        use: "file-loader"
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      phaser: phaser
    }
  },
  plugins: [
    new CleanWebpackPlugin(["dist"], {
      root: path.resolve(__dirname, "../")
    }),
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true)
    }),
    new HtmlWebpackPlugin({
      template: "./index.html"
    })
  ]
};
