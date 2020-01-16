#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

$range(1, 10)
  .$concat($range(11, 20), $range(21, 30))
  .$collect()
  .$map(all => all.length)
  .$stdout;
