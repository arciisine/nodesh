import { Util } from './util/util';
import { TimeUtil } from './util/time';
import { RegisterUtil } from './util/register';

declare global {
  interface AsyncGenerator<T> {
    /**
     * Pause for a specified number of milliseconds
     */
    wait(ms: number): AsyncGenerator<T>;
    /**
     * Track the beginning of a timing operation.  The all parameter indicates whether or not
     * the timing process should be per sequence element or for the entire
     * sequence.
     */
    startTime(name: string, all?: boolean): AsyncGenerator<T>;
    /**
     * Track completion of a timing operation
     */
    stopTime(name: string, all?: boolean): AsyncGenerator<T>;
  }
}

function log(name: string, all: boolean, phase: 'start' | 'end', ...extra: any[]) {
  if (all || TimeUtil.timingCounts.has(name)) {
    const suffix = all ? 'all' : `${TimeUtil.timingCounts.get(name)}`;
    console.debug(`TIMER ${phase}${phase === 'end' ? '  ' : ''} ${name}[${suffix}]`, ...extra);
  }
}

RegisterUtil.operators({
  wait(ms: number) {
    return this.tap(() => Util.sleep(ms));
  },
  startTime<T>(this: AsyncGenerator<T>, name: string, count = true) {
    return this.tap(() => {
      if (TimeUtil.startTime(name, count)) {
        log(name, !count, 'start');
      }
    });
  },
  stopTime<T>(this: AsyncGenerator<T>, name: string, all = false) {
    const tap = () => {
      const res = TimeUtil.stopTime(name);
      if (res) {
        const [delta] = res;
        log(name, all, 'end', delta);
      }
    };
    return all ?
      this.collect().tap(tap).flatten() :
      this.tap(tap);
  }
});
