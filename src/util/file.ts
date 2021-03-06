import * as fs from 'fs';
import * as path from 'path';

export interface ScanEntry {
  file: string;
  relative: string;
  stats: fs.Stats;
}

export interface ScanHandler {
  testFile?(relative: string, entry?: ScanEntry): boolean;
  testDir?(relative: string, entry?: ScanEntry): boolean;
}

interface ScanConfig {
  base: string;
  entry?: ScanEntry;
  type: 'file' | 'dir';
  visited?: Set<string>;
  allowHidden?: boolean;
}

export class FileUtil {
  /**
   * Searches recursively for files/folders.
   */
  static async * scanDir(handler: ScanHandler, { base, allowHidden, type, entry, visited = new Set<string>() }: ScanConfig): AsyncGenerator<ScanEntry> {
    entry = (entry! ?? { file: base });

    for (const file of fs.readdirSync(entry.file)) {
      if (file === '.' || file === '..' || (!allowHidden && file.startsWith('.'))) {
        continue;
      }

      const full = path.resolve(entry.file, file);
      const stats = fs.lstatSync(full);
      const subEntry = { stats, file: full, relative: full.replace(`${base}/`, '') };

      if (subEntry.stats.isDirectory() || subEntry.stats.isSymbolicLink()) {
        const p = fs.realpathSync(full);
        if (!fs.statSync(p).isFile()) { // Only on folders
          if (!visited.has(p)) {
            visited.add(p);
          } else {
            continue;
          }
          if (!handler.testDir || handler.testDir(subEntry.relative, subEntry)) {
            if (type === 'dir') {
              yield subEntry;
            }
            yield* FileUtil.scanDir(handler, { base, entry: subEntry, type, visited, allowHidden });
          }
        }
      }
      if (type === 'file' && (!handler.testFile || handler.testFile(subEntry.relative, subEntry))) {
        yield subEntry;
      }
    }
  }

  /**
   * Generates a matcher for file names, given the input string
   */
  static getFileMatcher(pattern: string | RegExp): (name: string) => boolean {
    if (pattern instanceof RegExp) {
      return pattern.test.bind(pattern);
    }

    if (/[?*{}\[\]]/.test(pattern)) {
      const picomatch = require('picomatch');
      const pm = picomatch(pattern);
      return x => pm(x);
    }

    return x => x.endsWith(pattern);
  }
}
