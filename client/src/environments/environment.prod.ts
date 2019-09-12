import { version } from '../../package.json';

export const environment = {
    VERSION: version,
    production: true,
    sentryEnvironment: 'production',
    socketHost: 'https://spaceships.app',
};
