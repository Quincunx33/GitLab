const https = require('https');
https.get({
  hostname: 'api.github.com',
  path: '/repos/octocat/Hello-World/commits',
  headers: { 'User-Agent': 'Node' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const commits = JSON.parse(data);
    console.log(commits[0].commit.tree.sha);
  });
});
