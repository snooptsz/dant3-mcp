const stamp = Date.now();
const headers = {
  'user-agent': 'dant3-live-web-smoke/1.0',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
};

function fail(message) {
  throw new Error(message);
}

async function request(path, { redirect = 'follow' } = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const url = `https://dant3.net${path}${separator}dant3_smoke=${stamp}`;
  const response = await fetch(url, { headers, redirect });
  const text = await response.text();
  return { response, text, requested: url };
}

const root = await request('/');
if (!root.response.ok) fail(`Root returned HTTP ${root.response.status}`);
if (new URL(root.response.url).pathname !== '/feed') {
  fail(`Root did not resolve to /feed; final URL was ${root.response.url}`);
}

const feed = await request('/feed');
if (!feed.response.ok) fail(`/feed returned HTTP ${feed.response.status}`);
if (new URL(feed.response.url).pathname !== '/feed') fail(`/feed redirected unexpectedly to ${feed.response.url}`);

const view = await request('/how-it-works');
if (!view.response.ok) fail(`/how-it-works returned HTTP ${view.response.status}`);
if (!/Dant3 View|The feed is the front door/i.test(view.text)) {
  fail('/how-it-works does not expose the current Dant3 View copy');
}

const report = {
  ok: true,
  checkedAt: new Date().toISOString(),
  root: { status: root.response.status, finalPath: new URL(root.response.url).pathname },
  feed: { status: feed.response.status, finalPath: new URL(feed.response.url).pathname },
  dant3View: {
    status: view.response.status,
    finalPath: new URL(view.response.url).pathname,
    currentCopy: true,
  },
};

console.log(JSON.stringify(report, null, 2));
