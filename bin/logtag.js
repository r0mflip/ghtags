#!/usr/bin/env node

'use strict';

const {createWriteStream} = require('fs');
const {resolve: resolvePath, normalize: normalizePath} = require('path');

const logtag = require('../');

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
    'logtag',
    '',
    'Generate releases/changelog/history file from tags and releases in GitHub repo.',
    '',
    'Usage:',
    ' $ logtag --repo expressjs/express \\',
    '    --token <GitHubAccesToken> \\         # Personal access token for GitHub API',
    '    --out <OutputFile>.md \\              # Output to file, default is stdout',
    '    --releases                           # Use GH releases instead of git tags',
    '',
    'Options:',
    '  --repo <repo>      Specify repo in <scope>/<repo> format (-r)',
    '  --token <token>    GitHub access token (-t)',
    '  --out <file>       Save formatted markdown output into file (-o)',
    '  --releases         If specified gets info from releases instead of tags',
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

async function logwriter(dataGenerator, outfile) {
  const outStream = !outfile ? process.stdout : createWriteStream(outfile);

  if (outfile) {
    console.log(`Writing to ${resolvePath(normalizePath(outfile))}`);
  }

  outStream.write('# Changelog\n');

  for await (const data of dataGenerator) {
    const name = data.name;
    const body = data.body.trim();
    if (noempty) {
      if (!body || body === name || `v${body}` === name || `V${body}` === name) {
        continue; // Ignore empty message bodies
      }
    }
    const msg = [
      '',
      `## ${data.name}`,
      `Released by ${data.author} on ${data.date}${data.prerelease ? ' `pre-release`' : ''}`,
      '',
      `${data.body}`,
      '',
      ''
    ].join('\n');
    outStream.write(msg);
  }
}

(async _ => {
  const tagSpitter = await logtag({repo, token, releases});
  await logwriter(tagSpitter, outfile);
})();
