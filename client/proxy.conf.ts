const PROXY_CONFIG = [
    {
        context: [
            '/api',
            '/sso',
            '/data',
            '/socket.io',
        ],
        secure: false,
        target: 'http://localhost:3731',
        ws: true,
    },
];

module.exports = PROXY_CONFIG;
