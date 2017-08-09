const PROXY_CONFIG = [
  {
    context: [
      '/api',
      '/sso',
    ],
    secure: false,
    target: 'http://localhost:3000',
  },
];

module.exports = PROXY_CONFIG;
