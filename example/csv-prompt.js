#!/usr/bin/env -S npx @arcsine/nodesh

/**
 * Prompt the user for input, and map to the CSV operator,
 * producing the appropriate object
 */

'Enter A Row'
  .$repeat() // Provide prompt text, infinitely
  .$prompt() // Request input given prompt
  .$notEmpty() // Ensure output is defined
  .$first() // Take first (repeat until defined)
  .$csv(['One', 'Two', 'Three']) // Convert to object
  .$console; // { One:.., Two:.., Three: ..}