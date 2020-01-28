#!/usr/bin/env -S npx .
/// @ts-check
/// <reference types=".." lib="npx-scripts" />


'https://www.google.com/favicon.ico'
  .$http({
    headers: {
      authority: 'www.google.com',
      pragma: 'no-cache',
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
      accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
      referer: 'https://www.google.com/',
      'accept-encoding': 'gzip',
      'accept-language': 'en-US,en;q=0.9',
    },
    mode: 'binary'
  })
  .$gunzip('binary')
  .$stdout;