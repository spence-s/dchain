import ora from 'ora';
import debug from 'debug';

const debugLogger = debug('lassify');

/**
 * monkey patch our spinner to just output to debug
 * if debug is turned on, otherwise just use the normal
 * ora spinner
 */
function oraDebugRedirect(oraOptions) {
  const fakeOra = {};
  const oraLogger = debugLogger.extend('ora');
  if (debugLogger.enabled) {
    for (const method of ['start', 'stop', 'warn', 'succeed', 'fail']) {
      fakeOra[method] = oraLogger;
    }

    return fakeOra;
  }

  return ora(oraOptions);
}

export default oraDebugRedirect;
