import webpack from 'webpack';

export default {
  resolve: {
    fallback: {
      'fs': false,
      'path': false,
      'crypto': false
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_DEBUG': false
    })
  ]
};
