'use strict';
const {get} = require('https');

/**
 * Return the next page number from link in  headers
 *
 * @param {Object} headers
 */
function getNextPage(headers) {
  const link = headers.link;
  const result = /\?page=(\d)>;\s*rel="next"/.exec(link);
  if (result && result[1]) {
    return Number.parseInt(result[1], 10);
  }

  return NaN;
}

/**
 * @param {Object} options
 * @param {String} options.token
 * @param {String} options.path
 * @param {Number} options.page
 * @returns
 */
function getRequestData({token, path, page = 0}) {
  return {
    hostname: 'api.github.com',
    path: `${path}${page ? `?page=${page}` : ''}`,
    headers: {
      'User-Agent': 'logtag/v0.1.0',
      'Authorization': `token ${token}`,
    },
  };
}

/**
 * Returns JSON from API
 *
 * @param {(Object|String|URL)} options
 * @returns {Promise}
 */
async function fetchJSON(options) {
  return new Promise((resolve, _) => {
    get(options, (res) => {
      if (res.statusCode !== 200) {
        resolve({err: 'Not found'});
      }
      const headers = res.headers;
      const data = [];

      res.on('data', chunk => {
        data.push(chunk.toString());
      });

      res.on('end', chunk => {
        data.push(chunk);
        resolve({data: JSON.parse(data.join('')), headers});
      });

      res.on('err', e => {
        resolve({err: e});
      })
    });
  });
}


/**
 * Return a ReadableStream that spits out all tagged commits
 * or releases using GitHub API
 *
 * @param {Object} options
 * @param {String} options.repo
 * @param {String} options.token
 * @param {Boolean} options.releases
 * @returns Readable
 */
async function* logtag({repo, token, releases = false}) {
  const repoEndpoint = `/repos/${repo}`;
  const dataPath = `${repoEndpoint}/${releases ? 'releases' : 'tags'}`;
  let currentPage = 0;

  while (true) {
    const {data, err, headers} = await fetchJSON(getRequestData({
      token,
      path: dataPath,
      page: currentPage,
    }));

    if (err) {
      break;
    }

    if (releases) {
      for (const release of data) {
        // Ignore draft releases
        if (release.draft) {
          continue;
        }

        yield {
          name: release.name,
          author: release.author.login,
          prerelease: release.prerelease,
          date: release.created_at,
          body: release.body,
        };
      }
    } else {
      for (const tag of data) {
        const commitId = tag.commit.sha;

        const {data, err} = await fetchJSON(getRequestData({
          token,
          path: `${repoEndpoint}/commits/${commitId}`,
        }));

        if (err) {
          continue;
        }

        yield {
          name: tag.name,
          author: data.commit.author.name,
          prerelease: false,
          date: data.commit.author.date,
          body: data.commit.message,
        };
      }
    }

    const nextPage = getNextPage(headers);

    if (!nextPage) {
      break;
    } else {
      currentPage = nextPage;
    }
  }
}

module.exports = logtag;
