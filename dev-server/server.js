const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const { Liquid } = require('liquidjs');

const app = express();
const PORT = 3000;

// Initialize Liquid template engine
const engine = new Liquid({
  root: [
    path.join(__dirname, '..', 'templates'),
    path.join(__dirname, '..', 'sections'),
    path.join(__dirname, '..', 'snippets'),
    path.join(__dirname, '..', 'layout')
  ],
  extname: '.liquid'
});

// Mock Shopify data
const mockData = {
  shop: {
    name: 'WTF | Welcome To Florida',
    domain: 'wtfswag.com'
  },
  page_title: 'WTF | Welcome To Florida',
  page_description: 'Cape Coral\'s premier kava bar - Premium edibles, beverages, cannabis and botanicals',
  settings: {
    type_body_font: 'Arial, sans-serif',
    type_header_font: 'Arial, sans-serif',
    favicon: '',
    google_analytics_id: '',
    facebook_pixel_id: '',
    tiktok_pixel_id: ''
  },
  request: {
    locale: {
      iso_code: 'en'
    }
  },
  current_page: 1,
  current_tags: [],
  content_for_header: '',
  template: 'index'
};

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// WebSocket server for live reload
const wss = new WebSocket.Server({ port: 3001 });

// Watch for file changes
chokidar.watch([
  path.join(__dirname, '..', 'assets'),
  path.join(__dirname, '..', 'templates'),
  path.join(__dirname, '..', 'sections'),
  path.join(__dirname, '..', 'snippets'),
  path.join(__dirname, '..', 'layout')
], { ignoreInitial: true }).on('change', () => {
  // Notify all connected clients to reload
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

// Helper function to process Liquid templates
async function processTemplate(templateName, data = {}) {
  try {
    const mergedData = { ...mockData, ...data };
    
    // Load the template
    let templateContent;
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.liquid`);
    const jsonPath = path.join(__dirname, '..', 'templates', `${templateName}.json`);
    
    if (fs.existsSync(jsonPath)) {
      // JSON template (section-based)
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      templateContent = await buildSectionBasedTemplate(jsonContent, mergedData);
    } else if (fs.existsSync(templatePath)) {
      // Liquid template
      templateContent = fs.readFileSync(templatePath, 'utf8');
    } else {
      throw new Error(`Template ${templateName} not found`);
    }
    
    // Render with layout
    const layoutPath = path.join(__dirname, '..', 'layout', 'theme.liquid');
    let layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Replace {{ content_for_layout }} with template content
    layoutContent = layoutContent.replace('{{ content_for_layout }}', templateContent);
    
    // Process the complete HTML
    let html = await engine.parseAndRender(layoutContent, mergedData);
    
    // Add live reload script
    html = html.replace('</body>', `
      <script>
        const ws = new WebSocket('ws://localhost:3001');
        ws.onmessage = function(event) {
          if (event.data === 'reload') {
            window.location.reload();
          }
        };
      </script>
      </body>
    `);
    
    // Fix asset paths
    html = html.replace(/\{\{\s*'([^']*\.(css|js|png|jpg|jpeg|gif|svg))'\s*\|\s*asset_url\s*\}\}/g, '/assets/$1');
    html = html.replace(/\{\{\s*"([^"]*\.(css|js|png|jpg|jpeg|gif|svg))"\s*\|\s*asset_url\s*\}\}/g, '/assets/$1');
    
    return html;
  } catch (error) {
    console.error('Template processing error:', error);
    return `<html><body><h1>Template Error</h1><pre>${error.message}</pre></body></html>`;
  }
}

// Build section-based template from JSON
async function buildSectionBasedTemplate(jsonContent, data) {
  let html = '';
  
  if (jsonContent.sections && jsonContent.order) {
    for (const sectionId of jsonContent.order) {
      const section = jsonContent.sections[sectionId];
      if (section && section.type) {
        try {
          const sectionPath = path.join(__dirname, '..', 'sections', `${section.type}.liquid`);
          if (fs.existsSync(sectionPath)) {
            let sectionContent = fs.readFileSync(sectionPath, 'utf8');
            
            // Mock section data
            const sectionData = {
              ...data,
              section: {
                id: sectionId,
                settings: section.settings || {},
                blocks: section.blocks || {},
                block_order: section.block_order || []
              }
            };
            
            const renderedSection = await engine.parseAndRender(sectionContent, sectionData);
            html += renderedSection;
          }
        } catch (error) {
          console.error(`Error rendering section ${section.type}:`, error);
          html += `<!-- Error rendering section ${section.type}: ${error.message} -->`;
        }
      }
    }
  }
  
  return html;
}

// Routes
app.get('/', async (req, res) => {
  const html = await processTemplate('index');
  res.send(html);
});

app.get('/pages/:page', async (req, res) => {
  const pageName = req.params.page;
  const html = await processTemplate(`page.${pageName}`, {
    page_title: `${pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('-', ' ')} | WTF`
  });
  res.send(html);
});

app.get('/collections/:collection', async (req, res) => {
  const collectionName = req.params.collection;
  const html = await processTemplate(`collection.${collectionName}`, {
    page_title: `${collectionName.charAt(0).toUpperCase() + collectionName.slice(1).replace('-', ' ')} | WTF`
  });
  res.send(html);
});

app.get('/products/:product', async (req, res) => {
  const productName = req.params.product;
  const html = await processTemplate(`product.${productName}`, {
    page_title: `${productName.charAt(0).toUpperCase() + productName.slice(1).replace('-', ' ')} | WTF`
  });
  res.send(html);
});

// Catch-all for other routes
app.get('*', async (req, res) => {
  const html = await processTemplate('index');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 WTF Theme Dev Server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, '..')}`);
  console.log(`🔄 Live reload enabled on ws://localhost:3001`);
  console.log('');
  console.log('📖 Available routes:');
  console.log('   Homepage: http://localhost:3000/');
  console.log('   Kratom Teas: http://localhost:3000/pages/kratom-teas');
  console.log('   Kava Drinks: http://localhost:3000/pages/kava-drinks');
  console.log('   THC Drinks: http://localhost:3000/pages/thc-drinks');
  console.log('   Draft Pours: http://localhost:3000/pages/draft-pours');
  console.log('');
});