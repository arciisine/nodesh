#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

$exec('ps', ['aux'])
  .$columns(['user', 'pid'])
  // .$execEach('kill', ['-9'])
  .$console;