import * as assert from 'assert';

import { Suite, Test } from '@travetto/test';

import '../src/index';

@Suite()
export class FileSuite {

  @Test()
  async testRead() {
    const content = await `${__dirname}/files/book.txt`
      .$read();

    assert(content.length === 7);
    assert(content[0] === 'Chapter 1');
  }

  @Test()
  async testReadText() {
    const [content] = await `${__dirname}/files/book.txt`
      .$read({ singleValue: true });

    assert(content.length > 40);
    assert(content.includes('Chapter 1'));
    assert(content.includes('Chapter 2'));
    assert(content.split(/\n/g).length === 7);
  }

  @Test()
  async testReadData() {
    const buffers = await `${__dirname}/files/book.txt`
      .$read({ mode: 'binary' });

    const content = Buffer.concat(buffers).toString('utf8');

    assert(content.length > 40);
    assert(content.includes('Chapter 1'));
    assert(content.includes('Chapter 2'));
    assert(content.split(/\n/g).length === 7);
  }

  @Test()
  async testDir() {
    const all = await '.txt'
      .$dir({ base: __dirname })
      .$map(x => x.split(__dirname)[1])
      .$sort();

    assert(all.length === 4);
    assert(all[0] === '/files/a.txt');
  }

  @Test()
  async testDirRegex() {
    const all = await /^test\/files\/.*[.]txt/
      .$dir()
      .$map(x => x.split(__dirname)[1])
      .$sort();

    assert(all.length === 4);
    assert(all[0] === '/files/a.txt');
  }

  @Test()
  async testDirObj() {
    const all = await '**/*.txt'
      .$dir({ base: __dirname, full: true })
      .$sort((a, b) => a.relative.localeCompare(b.relative));

    assert(all.length === 4);
    assert(all[0].relative === 'files/a.txt');
    assert(+all[0].stats.mtime > 0);
  }

  @Test()
  async testReadLineObjects() {
    const allNames = await '**/*.txt'
      .$dir({ base: __dirname });

    const all = await allNames
      .$readLines({ mode: 'object' });

    assert(all.length === 10);

    const names = await all
      .$map(x => x.file)
      .$unique();

    assert.deepStrictEqual(names, allNames);
  }

  @Test()
  async testReadLines() {
    const allNames = await '**/*.txt'
      .$dir({ base: __dirname });

    const all = await allNames
      .$readLines();

    assert(all.length === 10);

    const names = await all
      .$map(x => x.split(' ')[0])
      .$unique();

    assert.deepStrictEqual(names, allNames);

    const [numbers] = await all
      .$tokens(/\s+\d+:/)
      .$map(x => 1)
      .$reduce((acc, v) => acc + v, 0);


    assert(numbers === 10);

    const allWithoutNumbers = await allNames
      .$readLines({ number: false })
      .$tokens(/\s+\d+:/);

    assert(allWithoutNumbers.length === 0);
  }
}