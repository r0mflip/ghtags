#!/usr/bin/env node

'use strict';

const {createWriteStream} = require('fs');
const {resolve: resolvePath, normalize: normalizePath} = require('path');

const getTags = require('../');

const args = process.argv.slice(2);

let repo = '';
let token = '';
let outfile = '';
let releases = false;
let noempty = false;
let help = false;

for (let idx = 0; idx < args.length; ) {
  const arg = args[idx++];
  if (arg === '--repo' || arg === '-r') {
    repo = idx < args.length ? args[idx++] : repo;
  }

  if (arg === '--out' || arg === '-o') {
    outfile = idx < args.length ? args[idx++] : outfile;
  }

  if (arg === '--token' || arg === '-t') {
    token = idx < args.length ? args[idx++] : token;
  }

  if (arg === '--releases') {
    releases = true;
    idx++;
  }

  if (arg === '--noempty' || arg === '-n') {
    noempty = true;
  }

  if (arg === '--help' || arg === '-h') {
    help = true;
    idx++;
  }
}

function printHelp() {
  process.stdout.write([
    '',
    'ghtags',
    '',
    'Generate releases/changelog/history file from tags and releases in GitHub repo.',
    '',
    'Usage:',
    ' $ ghtags --repo expressjs/express \\',
    '    --token <GitHubAccesToken> \\         # Personal access token for GitHub API',
    '    --out <OutputFile>.md \\              # Output to file, default is stdout',
    '    --releases                           # Use GH releases instead of git tags',
    '',
    'Options:',
    '  --repo <repo>      Specify repo in <scope>/<repo> format (-r)',
    '  --token <token>    GitHub access token (-t)',
    '  --out <file>       Save formatted markdown output into file (-o)',
    '  --releases         If specified gets info from releases (uses tags by default)',
    '  --noempty          Skip entities with empty or same body as tag name (-n)',
    '  --help             Prints this message (-h)',
    '',
    '',
  ].join('\n'));
  process.exit(0);
}

if (help || !repo || !token) {
  printHelp();
}


// Read endlessly from dataGenerator and write formatted data.
async function logwriter(dataGenerator, outfile) {
  // Log to stdout by default.
  const outStream = !outfile ? process.stdout : createWriteStream(outfile);

  if (outfile) {
    console.log(`Writing to ${resolvePath(normalizePath(outfile))}`);
  }

  outStream.write('# Changelog\n');

  for await (const data of dataGenerator) {
    // https://stackoverflow.com/a/3561711
    const escapedName = data.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // If body starts with the name of release (commit messages do this) strip it off.
    const body = data.body.replace(new RegExp(`^\s*${escapedName}(\n*|$)`, 'i'), '');

    // Ignore if empty message body or body and tag are the same using the (v) prefix (version).
    if (noempty && (!body || `v${body}` === data.name || `v${data.name}` === body)) {
      continue;
    }

    const msg = [
      '',
      `## [${data.name}](${data.url})`,
      `${data.author} released this on ${data.date.slice(0, 10)}`,
      '',
      `${body}`,
      '',
      ''
    ].join('\n');

    outStream.write(msg);
  }
}

(async _ => {
  const tagSpitter = await getTags({repo, token, releases});
  await logwriter(tagSpitter, outfile);
})();
