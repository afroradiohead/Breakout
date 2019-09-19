const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  devtool: false,
  output: {
    filename: 'main.js',
    path: path.join(__dirname)
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: {
          or: [
              path.resolve(__dirname, '.history')
          ]
      },
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts', ".js"
    ]
  },
  plugins: [ ]
};