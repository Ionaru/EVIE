// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

import * as karma from 'karma';

module.exports = function (config: karma.Config) {

  const configuration: any = {
    basePath: '',
    frameworks: ['mocha', '@angular/cli'],
    plugins: [
      require('karma-mocha'),
      require('karma-mocha-reporter'),
      require('karma-phantomjs-launcher'),
      require('karma-remap-istanbul'),
      require('karma-coverage'),
      require('karma-coveralls'),
      require('@angular/cli/plugins/karma')
    ],
    files: [
      {pattern: './src/test.ts', watched: false}
    ],
    preprocessors: {
      './src/test.ts': ['@angular/cli']
    },
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
    coverageIstanbulReporter: {
      reports: ['lcov'],
      fixWebpackSourcePaths: true
    },
    angularCli: {
      environment: 'dev'
    },
    reporters: config['angularCli'] && config['angularCli'].codeCoverage
      ? ['mocha', 'karma-remap-istanbul', 'coverage', 'coveralls']
      : ['mocha'],
    mochaReporter: {
      showDiff: true
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
    concurrency: 1
  };

  if (process.env['SAUCELABS'] === 'true') {
    // Tests are being run on Saucelabs

    const saucelabsBrowsers = {
      // Linux
      SL_Linux_Chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Linux',
        version: 'latest'
      },
      SL_Linux_Firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        version: 'latest'
      },
    };

    const timeout = 15 * 60 * 1000; // 15 minutes
    configuration.browserNoActivityTimeout = 3 * 60 * 1000; // 3 minutes
    configuration.captureTimeout = timeout;
    configuration.plugins.push(require('karma-sauce-launcher'));
    configuration.customLaunchers = saucelabsBrowsers;
    configuration.browsers = Object.keys(saucelabsBrowsers);
    configuration.sauceLabs = {
      testName: 'EVE Track Client tests'
    };
    configuration.reporters = ['saucelabs', 'mocha'];

  } else if (process.env['BROWSERSTACK'] === 'true') {
    // Tests are being run on BrowserStack

    const browserStackBrowsers = {
      BS_Win7_IE: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '7',
        browser: 'IE'
      },
      BS_Win7_Chrome: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '7',
        browser: 'Chrome'
      },
      BS_Win7_Firefox: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '7',
        browser: 'Firefox'
      },

      BS_Win10_IE: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '10',
        browser: 'IE'
      },
      BS_Win10_Edge: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '10',
        browser: 'Edge'
      },
      BS_Win10_Chrome: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '10',
        browser: 'Chrome'
      },
      BS_Win10_Firefox: {
        base: 'BrowserStack',
        os: 'WINDOWS',
        os_version: '10',
        browser: 'Firefox'
      },

      BS_OSX8_Safari: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Mountain Lion',
        browser: 'Safari'
      },
      BS_OSX8_Chrome: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Mountain Lion',
        browser: 'Chrome'
      },
      BS_OSX8_Firefox: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Mountain Lion',
        browser: 'Firefox'
      },

      BS_OSX11_Safari: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Safari'
      },
      BS_OSX11_Chrome: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Chrome'
      },
      BS_OSX11_Firefox: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'El Capitan',
        browser: 'Firefox'
      },

      BS_OSX12_Safari: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'Safari'
      },
      BS_OSX12_Chrome: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'Chrome'
      },
      BS_OSX12_Firefox: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Sierra',
        browser: 'Firefox'
      },
    };

    configuration.browserStack = {
      name: 'EVE Track Client test',
    };

    configuration.plugins.push(require('karma-browserstack-launcher'));
    configuration.customLaunchers = browserStackBrowsers;
    configuration.browsers = Object.keys(browserStackBrowsers);
    configuration.reporters = ['dots', 'BrowserStack'];

  } else {
    // Tests are being run locally or on TravisCI
    configuration.browsers = ['PhantomJS'];
  }

  config.set(configuration);
};
