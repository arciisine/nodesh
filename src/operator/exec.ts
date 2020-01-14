
import { StreamUtil } from '../util/stream';
import { ExecUtil } from '../util/exec';
import { $AsyncIterable, ExecConfig, CompletableStream } from '../types';
import { AsyncUtil } from '../util/async';

/**
 * Support for dealing with execution of external programs
 */
export class ExecOperators {
  /**
   * Pipe the entire sequence as input into the command to be executed.  Allow for args and flags to be
   * appended to the command as needed.  If the output is specified as 'binary', the generator
   * will return a sequence of `Buffer`s, otherwise will return `string`s
   *
   * @example
   * '.ts'
   *   .$dir() // Get all files
   *   .$read() // Read all files
   *   .$exec('wc', ['-l']) // Execute word count for all files
   *   // Run in a single operation
   *
   * @example
   * '.ts'
   *   .$dir() // Get all files
   *   .$read() // Read all files
   *   .$exec('npx', {
   *      args: ['tslint'],
   *      spawn : {
   *        env : { NO_COLOR: '1' }
   *      }
   *   }) // Tslint every file
   *   // Run in a single operation
   */
  $exec(cmd: string, config?: string[] | Omit<ExecConfig, 'mode'>): $AsyncIterable<string>;
  $exec(cmd: string, config: ExecConfig<'text'>): $AsyncIterable<string>;
  $exec(cmd: string, config: ExecConfig<'binary'>): $AsyncIterable<Buffer>;
  $exec(cmd: string, config: ExecConfig<'raw'>): $AsyncIterable<CompletableStream>;
  async * $exec<T>(
    this: AsyncIterable<T>, cmd: string, configOrArgs: string[] | ExecConfig = {}
  ): $AsyncIterable<string | Buffer | CompletableStream> {
    const config = Array.isArray(configOrArgs) ? { args: configOrArgs } : configOrArgs;
    const { proc, result } = ExecUtil.exec(cmd, config);

    StreamUtil.toStream(this, config.input).pipe(proc.stdin!);

    if (config.mode === 'raw') {
      const res = await StreamUtil.readStream(proc.stdout!, config as { mode: 'raw' }).$value;
      yield { ...res, completed: AsyncUtil.combine(result, res.completed) };
    } else {
      yield* StreamUtil.readStream(proc.stdout!, config);
    }
    await result;
  }
}
