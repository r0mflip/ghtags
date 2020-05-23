# logtag

Generate releases/changelog/history file from
tags(default) and releases in GitHub repo.

The output file is written in markdown.

> This is an experimental module of mine (as usual 😝)

## Installation

``` sh
$ npm i -g @r0mflip/logtag
```

## Usage

``` sh
$ logtag --repo expressjs/express \
    --token <GitHubAccesToken> \       # Personal access token for GitHub API
    --out <OutputFile>.md \            # Output to file, default is stdout
    --releases                         # Use GitHub releases instead of git tags
```

## API

```js
// CJS
const logtag = require('@r0mflip/logtag');

// ESM
import logtag from '@r0mflip/logtag';


// logtag is an AsyncGeneratorFunction
// which returns an AsyncGenerator
const tagSpitter = logtag({
  repo: 'expressjs/express',
  token: '<GITHUB_TOKEN>',
  releases: false,
});

(async _ => {
  for await (const tag of tagSpitter) {
    // Use tag of type
    AsyncGenerator<{
      name: String;
      author: String;
      prerelease: Boolean;
      date: String;
      body: String;
    }, void, unknown>
  }
})();
```

Know more about [Asynchronous generators](https://exploringjs.com/impatient-js/ch_async-iteration.html#async-generators)

# LICENSE
[MIT](LICENSE)
