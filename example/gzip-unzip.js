#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types="../dist" lib="npx-scripts" />

__filename
  .$read({ mode: 'binary' })
  .$gzip()
  .$gunzip()
  .$stdout;
