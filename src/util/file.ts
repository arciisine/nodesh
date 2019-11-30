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

export class FileUtil {
  /**
   * Searches recursively for files/folders.
   */
  static async * scanDir(handler: ScanHandler, base: string, entry?: ScanEntry, visited = new Set<string>()): AsyncGenerator<ScanEntry> {
    entry = (entry! ?? { file: base });

    for (const file of fs.readdirSync(entry.file)) {
      if (file.startsWith('.')) {
        continue;
      }

      const full = path.resolve(entry.file, file);
      const stats = fs.lstatSync(full);
      const subEntry = { stats, file: full, relative: full.replace(`${base}/`, '') };

      if (subEntry.stats.isDirectory() || subEntry.stats.isSymbolicLink()) {
        if (subEntry.stats.isSymbolicLink()) {
          const p = fs.realpathSync(full);
          if (!visited.has(p)) {
            yield subEntry;
            visited.add(p);
          } else {
            continue;
          }
        }
        if (!handler.testDir || handler.testDir(subEntry.relative, subEntry)) {
          yield* FileUtil.scanDir(handler, base, subEntry, visited);
        }
      } else if (!handler.testFile || handler.testFile(subEntry.relative, subEntry)) {
        yield subEntry;
      }
    }
  }
}
