import { version } from '../../package.json';

export const environment = {
    VERSION: version,
    production: true,
    sentryEnvironment: 'development',
    socketHost: 'https://dev.spaceships.app',
};
