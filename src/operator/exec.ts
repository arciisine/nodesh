
import { StreamUtil } from '../util/stream';
import { ExecUtil } from '../util/exec';
import { $AsyncIterable, ExecConfig, ReadStreamConfig } from '../types';

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
   */
  $exec(cmd: string, config: ExecConfig<'text'>): $AsyncIterable<string>;
  $exec(cmd: string, config: ExecConfig<'binary'>): $AsyncIterable<Buffer>;
  $exec(cmd: string, config?: Omit<ExecConfig, 'mode'>): $AsyncIterable<string>;
  async * $exec<T>(this: AsyncIterable<T>, cmd: string, config: ExecConfig = {}): $AsyncIterable<string | Buffer> {
    const { proc, result } = ExecUtil.exec(cmd, config);
    StreamUtil.toStream(this, config.input).pipe(proc.stdin!);
    yield* StreamUtil.readStream(proc.stdout!, config);
    await result;
  }
}