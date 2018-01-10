export interface IKarmaConfig extends karma.Config {
  angularCli: any;
}

import * as karma from 'karma';
import karmaCoverageIstanbulReporter = require('karma-coverage-istanbul-reporter');
import karmaMocha = require('karma-mocha');
import karmaMochaReporter = require('karma-mocha-reporter');
import karmaPhantomjsLauncher = require('karma-phantomjs-launcher');

module.exports = (config: IKarmaConfig) => {

  const configuration: any = {
    angularCli: {
      environment: 'dev',
    },
    autoWatch: true,
    basePath: '',
    colors: true,
    concurrency: 1,
    coverageIstanbulReporter: {
      fixWebpackSourcePaths: true,
      reports: ['html', 'lcovonly'],
    },
    files: [
      {pattern: './src/test.ts', watched: false},
    ],
    frameworks: ['mocha', '@angular/cli'],
    logLevel: config.LOG_INFO,
    mime: {
      'text/x-typescript': ['ts', 'tsx'],
    },
    mochaReporter: {
      showDiff: true,
    },
    plugins: [
      karmaMocha,
      karmaMochaReporter,
      karmaPhantomjsLauncher,
      karmaCoverageIstanbulReporter,
      require('@angular/cli/plugins/karma'),
    ],
    port: 9876,
    preprocessors: {
      './src/test.ts': ['@angular/cli'],
    },
    reporters: config.angularCli && config.angularCli.codeCoverage
      ? ['coverage-istanbul', 'mocha']
      : ['mocha'],
    singleRun: false,
  };

  if (process.env.SAUCELABS === 'true') {
    // Tests are being run on Saucelabs

    const saucelabsBrowsers = {
      // Linux
      SL_Linux_Chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Linux',
        version: 'latest',
      },
      SL_Linux_Firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Linux',
        version: 'latest',
      },
    };

    const timeout = 15 * 60 * 1000; // 15 minutes
    configuration.browserNoActivityTimeout = 3 * 60 * 1000; // 3 minutes
    configuration.captureTimeout = timeout;
    configuration.plugins.push(require('karma-sauce-launcher'));
    configuration.customLaunchers = saucelabsBrowsers;
    configuration.browsers = Object.keys(saucelabsBrowsers);
    configuration.sauceLabs = {
      testName: 'EVE Track Client tests',
    };
    configuration.reporters = ['saucelabs', 'mocha'];

  } else if (process.env.BROWSERSTACK === 'true') {
    // Tests are being run on BrowserStack

    const browserStackBrowsers = {
      BS_OSX11_Chrome: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'OS X',
        os_version: 'El Capitan',
      },
      BS_OSX11_Firefox: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'OS X',
        os_version: 'El Capitan',
      },
      BS_OSX11_Safari: {
        base: 'BrowserStack',
        browser: 'Safari',
        os: 'OS X',
        os_version: 'El Capitan',
      },

      BS_OSX12_Chrome: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'OS X',
        os_version: 'Sierra',
      },
      BS_OSX12_Firefox: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'OS X',
        os_version: 'Sierra',
      },
      BS_OSX12_Safari: {
        base: 'BrowserStack',
        browser: 'Safari',
        os: 'OS X',
        os_version: 'Sierra',
      },

      BS_OSX8_Chrome: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'OS X',
        os_version: 'Mountain Lion',
      },
      BS_OSX8_Firefox: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'OS X',
        os_version: 'Mountain Lion',
      },

      BS_OSX8_Safari: {
        base: 'BrowserStack',
        browser: 'Safari',
        os: 'OS X',
        os_version: 'Mountain Lion',
      },

      BS_Win10_Chrome: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'WINDOWS',
        os_version: '10',
      },
      BS_Win10_Edge: {
        base: 'BrowserStack',
        browser: 'Edge',
        os: 'WINDOWS',
        os_version: '10',
      },
      BS_Win10_Firefox: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'WINDOWS',
        os_version: '10',
      },

      BS_Win10_IE: {
        base: 'BrowserStack',
        browser: 'IE',
        os: 'WINDOWS',
        os_version: '10',
      },
      BS_Win7_Chrome: {
        base: 'BrowserStack',
        browser: 'Chrome',
        os: 'WINDOWS',
        os_version: '7',
      },
      BS_Win7_Firefox: {
        base: 'BrowserStack',
        browser: 'Firefox',
        os: 'WINDOWS',
        os_version: '7',
      },

      BS_Win7_IE: {
        base: 'BrowserStack',
        browser: 'IE',
        os: 'WINDOWS',
        os_version: '7',
      },
    };

    configuration.browserStack = {
      name: 'EVE Track Client test',
    };

    configuration.plugins.push(require('karma-browserstack-launcher'));
    configuration.customLaunchers = browserStackBrowsers;
    configuration.browsers = Object.keys(browserStackBrowsers);
    configuration.reporters = ['dots', 'BrowserStack'];
    configuration.captureTimeout = 30 * 1000; // 30 seconds
    configuration.retryLimit = 3;

  } else {
    // Tests are being run locally or on TravisCI
    configuration.browsers = ['PhantomJS'];
  }

  config.set(configuration);
};
