import { TimeUtil } from '../util/time';
import { $AsyncIterable } from '../types';

function log(name: string, all: boolean, phase: 'start' | 'end', ...extra: any[]) {
  if (all || TimeUtil.timingCounts.has(name)) {
    const suffix = all ? 'all' : `${TimeUtil.timingCounts.get(name)}`;
    console.debug(`TIMER ${phase}${phase === 'end' ? '  ' : ''} ${name}[${suffix}]`, ...extra);
  }
}

/**
 * Operators regarding temporal analysis
 */
export class TimeOperators {
  /**
   * Pause for a specified number of milliseconds
   */
  $wait<T>(this: AsyncIterable<T>, ms: number): $AsyncIterable<T> {
    return this.$tap(() => TimeUtil.sleep(ms));
  }

  /**
   * Track the beginning of a timing operation.  The all parameter indicates whether or not
   * the timing process should be per sequence element or for the entire
   * sequence.
   */
  $startTime<T>(this: AsyncIterable<T>, name: string, count: boolean = true): $AsyncIterable<T> {
    return this.$tap(() => {
      if (TimeUtil.startTime(name, count)) {
        log(name, !count, 'start');
      }
    });
  }

  /**
   * Track completion of a timing operation
   */
  $stopTime<T>(this: AsyncIterable<T>, name: string, count: boolean = true): $AsyncIterable<T> {
    const tap = () => {
      const res = TimeUtil.stopTime(name);
      if (res) {
        const [delta] = res;
        log(name, !count, 'end', delta);
      }
    };
    return !count ?
      this.$collect().$tap(tap).$flatten() :
      this.$tap(tap);
  }
}