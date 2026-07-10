import packageJson from '../package.json';

const compactVersion = packageJson.version.replace(/\.0$/, '');

export const APP_VERSION = `v${compactVersion}`;
export const APP_VERSION_LABEL = `${APP_VERSION} beta`;
