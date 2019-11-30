export class TimeUtil {
  static timings = new Map<string, number>();
  static timingCounts = new Map<string, number>();

  /**
   * Get time as bigint
   */
  static getTime() {
    return this.hrtimeToMs(process.hrtime.bigint());
  }

  /**
   * Convert bigint to ms
   */
  static hrtimeToMs(val: bigint) {
    const ms = parseInt((val / BigInt('1000000')).toString(), 10);
    const ns = parseInt((val % BigInt('100000')).toString(), 10) / 100000;
    return parseFloat((ms + ns).toFixed(3));
  }

  static startTime(name: string, count = true) {
    if (count || !this.timings.has(name)) {
      this.timings.set(name, this.getTime());
      this.timingCounts.set(name, !count ? -1 : (this.timingCounts.get(name) ?? 0) + 1);
      return true;
    }
  }

  static stopTime(name: string) {
    if (this.timings.has(name)) {
      const delta = TimeUtil.getTime() - this.timings.get(name)!;
      const count = this.timingCounts.get(name);
      this.timings.delete(name);
      this.timingCounts.delete(name);
      return [delta, count] as const;
    }
  }
}