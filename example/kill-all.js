#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />

/**
 * Top level exec, turning ps into object stream
 */
const finder = new RegExp($argv[0] || 'travetto');

// Run ps
$exec('ps', ['aux'])
  // Convert to columns (linux specific)
  .$columns(['user', 'pid', 'cpu', 'mem', 'vsz', 'rss', 'tty', 'stat', 'start', 'time', 'command'])
  // Match commands
  .$filter(p => finder.test(p.command))
  // Log matched objects
  .$tap(console.log)
  // Kill all in parallel
  .$parallel(({ user, pid }) =>
    $exec('kill', ['-9', pid])
  )
  .$console;