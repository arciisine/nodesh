#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />


'.js'
  .$dir({ base: __dirname })
  .$readLines({ base: __dirname })
  .$console;