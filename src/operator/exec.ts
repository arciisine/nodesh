
import { StreamUtil } from '../util/stream';
import { ExecUtil } from '../util/exec';
import { IOType } from '../types';

/**
 * Support for dealing with execution of external programs
 */
export class ExecOperators {
  /**
   * Execute the command against each item in the sequence. Allow for a list of args
   * to prepend to the command execution.  The command's stdout is returned as individual
   * lines.
   *
   * @example
   * '.ts'.$
   *   .dir() // Get all files
   *   .execEach('wc', '-l') // Execute word count for each line
   */
  async * execEach<T>(this: AsyncGenerator<T>, cmd: string, args: string[]): AsyncGenerator<string> {
    for await (const item of this) {
      const finalArgs = [
        ...args,
        ...(!Array.isArray(item) ? [item] : item as any[])
      ];
      const { proc, result } = ExecUtil.exec(cmd, finalArgs);
      yield* StreamUtil.readStream(proc.stdout!);
      await result;
    }
  }

  /**
   * Pipe the entire sequence as input into the command to be executed.  Allow for args to be
   * prepended to the command as needed.  If the output is specified as 'binary', the generator
   * will return a sequence of Buffers, otherwise will return strings
   *
   * @example
   * '.ts'.$
   *   .dir() // Get all files
   *   .read() // Read all files
   *   .exec('wc', ['-l']) // Execute word count for all files
   *   // Run in a single operation
   */
  exec(cmd: string, args: string[], output: 'line' | 'text'): AsyncGenerator<string>;
  exec(cmd: string, args: string[], output: 'binary'): AsyncGenerator<Buffer>;
  exec(cmd: string, args: string[]): AsyncGenerator<string>;
  exec(cmd: string): AsyncGenerator<string>;
  async * exec<T>(this: AsyncGenerator<T>,
    cmd: string, args: string[] = [], outMode: IOType = 'line', inMode: IOType = outMode): AsyncGenerator<Buffer | string> {
    const { proc, result } = ExecUtil.exec(cmd, [...args]);
    this.stream(inMode).pipe(proc.stdin!);
    yield* StreamUtil.readStream(proc.stdout!, outMode);
    await result;
  }
}