import * as cp from 'child_process';
import { StreamUtil } from './stream';
import { ExecConfig } from '../types';

export class ExecUtil {
  /**
   * Executes a command, and returns the process.  If an error occurs,
   * it will read stderr (of the process) and return it as a single
   * value.
   */
  static exec(cmd: string, config: ExecConfig) {
    const proc = cp.spawn(cmd, config.args ?? [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...(config.spawn || {})
    });
    const mem = StreamUtil.memoryWritable();
    proc.stderr!.pipe(mem);

    const retCode = new Promise(res => proc.on('exit', res));
    const result = async function () {
      if ((await retCode) !== 0) {
        const msg = Buffer.concat(mem.store).toString('utf8');
        throw new Error(msg);
      }
    }();
    return { proc, result };
  }
}