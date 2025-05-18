const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
devServer: {
  static: './',
  port: 8087,
  open: true,
  proxy: {
    '/api': {
      target: 'https://story-api.dicoding.dev',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
      secure: false,
    },
  },
},
};
