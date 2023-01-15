import type { Options, Ora } from 'ora';
import ora from 'ora';
import debug from 'debug';

const debugLogger = debug('dchain');

export type FakeOraMethod =
  | 'start'
  | 'stop'
  | 'warn'
  | 'succeed'
  | 'fail'
  | 'info';
export type FakeOra = Record<
  FakeOraMethod,
  (arg: string, ...args: unknown[]) => void
> & { stop: () => void; succeed: () => void };

/**
 * monkey patch our spinner to just output to debug
 * if debug is turned on, otherwise just use the normal
 * ora spinner
 */
function oraDebugRedirect(oraOptions: Options): FakeOra | Ora {
  const fakeOra: Partial<FakeOra> = {};
  const oraLogger = debugLogger.extend('ora');
  if (debugLogger.enabled) {
    const fakeOraMethods: FakeOraMethod[] = [
      'start',
      'stop',
      'warn',
      'succeed',
      'fail',
      'info'
    ];
    for (const method of fakeOraMethods) {
      fakeOra[method] = (...args: any[]) => {
        if (args.length > 0) oraLogger(args[0], ...args.slice(1));
      };
    }

    return fakeOra as FakeOra;
  }

  return ora(oraOptions);
}

export default oraDebugRedirect;
