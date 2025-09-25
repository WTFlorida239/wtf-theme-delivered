const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const WebSocket = require('ws');

const app = express();
const PORT = 8080;

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'public')));

// WebSocket server for live reload
const wss = new WebSocket.Server({ port: 3002 });

// Watch for file changes
chokidar.watch([
  path.join(__dirname, 'public'),
  path.join(__dirname, 'templates')
], { ignoreInitial: true }).on('change', () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

// Live reload script
const liveReloadScript = `
<script>
  const ws = new WebSocket('ws://localhost:3002');
  ws.onmessage = function(event) {
    if (event.data === 'reload') {
      window.location.reload();
    }
  };
</script>
`;

// Serve HTML templates
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'templates', 'homepage.html');
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace('</body>', liveReloadScript + '</body>');
    res.send(html);
  } else {
    res.send(`
      <html>
        <head>
          <title>WTF Theme Preview - Building...</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
            .building { color: #ff6600; }
          </style>
        </head>
        <body>
          <h1 class="building">🚧 WTF Theme Preview</h1>
          <p>Building your theme preview...</p>
          <p>Available assets: <a href="/assets/">/assets/</a></p>
          ${liveReloadScript}
        </body>
      </html>
    `);
  }
});

app.get('/pages/:page', (req, res) => {
  const pageName = req.params.page;
  const htmlPath = path.join(__dirname, 'templates', `${pageName}.html`);
  
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace('</body>', liveReloadScript + '</body>');
    res.send(html);
  } else {
    res.send(`
      <html>
        <head>
          <title>${pageName} | WTF Theme</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; }
            .building { color: #ff6600; }
          </style>
        </head>
        <body>
          <h1 class="building">🚧 ${pageName.replace('-', ' ').toUpperCase()}</h1>
          <p>This page template is being built...</p>
          <p><a href="/">← Back to Homepage</a></p>
          ${liveReloadScript}
        </body>
      </html>
    `);
  }
});

// Asset directory listing
app.get('/assets/', (req, res) => {
  const assetsPath = path.join(__dirname, 'public');
  const files = fs.readdirSync(assetsPath);
  
  const html = `
    <html>
      <head>
        <title>WTF Theme Assets</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; }
          .file { margin: 0.5rem 0; }
          .css { color: #0066cc; }
          .js { color: #cc6600; }
          .img { color: #00cc66; }
        </style>
      </head>
      <body>
        <h1>🎨 WTF Theme Assets</h1>
        <p><a href="/">← Back to Homepage</a></p>
        <div>
          ${files.map(file => {
            const ext = path.extname(file).toLowerCase();
            let className = '';
            if (['.css'].includes(ext)) className = 'css';
            else if (['.js'].includes(ext)) className = 'js';
            else if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) className = 'img';
            
            return `<div class="file ${className}"><a href="/assets/${file}" target="_blank">${file}</a></div>`;
          }).join('')}
        </div>
        ${liveReloadScript}
      </body>
    </html>
  `;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 WTF Theme Simple Server running at http://localhost:${PORT}`);
  console.log(`📁 Assets available at: http://localhost:${PORT}/assets/`);
  console.log(`🔄 Live reload enabled`);
  console.log('');
  console.log('📖 Building HTML templates...');
});

module.exports = app;