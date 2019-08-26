const path = require('path');
// const merge = require('webpack-merge');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// Export a function. Accept the base config as the only param.

module.exports = async ({ config, mode }) => {
  // `mode` has a value of 'DEVELOPMENT' or 'PRODUCTION'
  // You can change the configuration based on that.
  // 'PRODUCTION' is used when building the static version of storybook.

  // Return the altered config
  // Typescript support
  config.module.rules.push(
    {
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: 'cache-loader',
        },
        {
          loader: 'ts-loader',
          // loader: require.resolve('awesome-typescript-loader'),
          options: {
            // useCache: true,
            // configFileName: '../tsconfig.story.json',
            // context: path.resolve(__dirname, '../'),
            configFile: path.resolve(__dirname, '../tsconfig.story.json'),
            transpileOnly: true,
            appendTsSuffixTo: [
              '/\.vue$'
            ],
            happyPackMode: false
          }
        }
      ]
    }
  );

  config.module.rules.push({
    test: /\.worker\.(js|ts)$/,
    use: {
      loader: 'worker-loader',
      options: {
        inline: mode === 'production',
        fallback: false,
        // publicPath: path.resolve(__dirname, '../public/workers'),
        name: '[name].[hash].js'
      }
    }
  });

  config.module.rules.push({
    test: /\.less$/,
    use: ['style-loader', 'css-loader', 'less-loader'],
    include: path.resolve(__dirname, '../'),
  });

  config.module.rules.push({
    test: /\.glsl$/,
    loader: 'raw-loader'
  });

  config.resolve.extensions = [
    '.mjs',
    '.js',
    '.jsx',
    '.vue',
    '.json',
    '.wasm',
    '.ts',
    '.tsx'
  ];

  config.plugins.push(
    new ForkTsCheckerWebpackPlugin({
      vue: true,
      tslint: true,
      formatter: 'codeframe',
      checkSyntacticErrors: false
    })
  );

  config.optimization.splitChunks = {
    chunks: 'all',
    cacheGroups: {
      ol: {
        name: 'chunk-ol', // split elementUI into a single package
        priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
        test: /[\\/]node_modules[\\/]?ol(.*)/, // in order to adapt to cnpm
        chunks: 'initial', // only package third parties that are initially dependent
      },
      maptalks: {
        name: 'chunk-maptalks', // split elementUI into a single package
        priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
        test: /[\\/]node_modules[\\/]?maptalks(.*)/, // in order to adapt to cnpm
        chunks: 'initial', // only package third parties that are initially dependent
      },
      mapbox: {
        name: 'chunk-mapbox', // split elementUI into a single package
        priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
        test: /[\\/]node_modules[\\/]?mapbox(.*)/, // in order to adapt to cnpm
        chunks: 'initial', // only package third parties that are initially dependent
      },
      libs: {
        name: 'chunk-libs',
        test: /[\\/]node_modules[\\/]/,
        priority: 10,
        chunks: 'initial', // only package third parties that are initially dependent
      },
      commons: {
        name: 'chunk-commons',
        test: path.resolve(__dirname, 'stories/components'),
        minChunks: 3, //  minimum common number
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  };

  // https://github.com/webpack-contrib/worker-loader/issues/166
  // https://github.com/webpack/webpack/issues/6642
  config.output.globalObject = 'this';

  return config;
};
