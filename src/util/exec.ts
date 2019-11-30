import * as cp from 'child_process';
import { StreamUtil } from './stream';

export class ExecUtil {
  /**
   * Executes a command, and returns the process.  If an error occurs,
   * it will read stderr (of the process) and return it as a single
   * value.
   */
  static exec(cmd: string, args: any[] | any, props: cp.SpawnOptions = {}) {
    const proc = cp.spawn(cmd, Array.isArray(args) ? args : [args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      ...props
    });
    const err = StreamUtil.readStream(proc.stderr!, 'text').value;
    const result = async function () {
      const code = await new Promise(res => proc.on('exit', res));
      if (code !== 0) {
        throw new Error(await err);
      }
    }();
    return { proc, result };
  }
}