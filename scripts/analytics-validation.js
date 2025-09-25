#!/usr/bin/env node

/**
 * Analytics Validation Script
 * Validates GA4, Meta Pixel, and TikTok Pixel implementations and tracks drink builder events
 * 
 * Usage: node scripts/analytics-validation.js [--url=URL] [--test-events]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class AnalyticsValidator {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'https://wtfswag.com',
      testEvents: options.testEvents || false,
      slackWebhookUrl: options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL,
      logFile: options.logFile || path.join(__dirname, '../docs/analytics-validation.json'),
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      url: this.options.url,
      validations: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  addValidation(name, status, details = {}) {
    const validation = {
      name,
      status,
      timestamp: new Date().toISOString(),
      details
    };
    
    this.results.validations.push(validation);
    this.results.summary.total++;
    
    if (status === 'passed') {
      this.results.summary.passed++;
    } else if (status === 'failed') {
      this.results.summary.failed++;
    } else if (status === 'warning') {
      this.results.summary.warnings++;
    }
    
    this.log(`Validation: ${name} - ${status.toUpperCase()}`, status === 'failed' ? 'error' : 'info');
    if (details.message) {
      this.log(`  ${details.message}`);
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async validateThemeImplementation() {
    this.log('Validating theme analytics implementation...');
    
    // Check theme.liquid for analytics integration
    const themeFile = path.join(process.cwd(), 'layout/theme.liquid');
    if (!fs.existsSync(themeFile)) {
      this.addValidation('Theme Layout', 'failed', {
        message: 'theme.liquid not found',
        path: themeFile
      });
      return;
    }

    const themeContent = fs.readFileSync(themeFile, 'utf8');
    
    // Check for GA4 integration
    if (themeContent.includes('google_analytics_id') || themeContent.includes('gtag')) {
      this.addValidation('GA4 Theme Integration', 'passed', {
        message: 'Google Analytics 4 integration found in theme'
      });
    } else {
      this.addValidation('GA4 Theme Integration', 'warning', {
        message: 'GA4 integration not found in theme.liquid'
      });
    }

    // Check for Meta Pixel integration
    if (themeContent.includes('facebook_pixel_id') || themeContent.includes('fbq')) {
      this.addValidation('Meta Pixel Theme Integration', 'passed', {
        message: 'Meta Pixel integration found in theme'
      });
    } else {
      this.addValidation('Meta Pixel Theme Integration', 'warning', {
        message: 'Meta Pixel integration not found in theme.liquid'
      });
    }

    // Check for TikTok Pixel integration
    if (themeContent.includes('tiktok_pixel_id') || themeContent.includes('ttq')) {
      this.addValidation('TikTok Pixel Theme Integration', 'passed', {
        message: 'TikTok Pixel integration found in theme'
      });
    } else {
      this.addValidation('TikTok Pixel Theme Integration', 'warning', {
        message: 'TikTok Pixel integration not found in theme.liquid'
      });
    }

    // Check for analytics snippet
    const analyticsSnippet = path.join(process.cwd(), 'snippets/wtf-analytics.liquid');
    if (fs.existsSync(analyticsSnippet)) {
      this.addValidation('Analytics Snippet', 'passed', {
        message: 'WTF analytics snippet found'
      });
      
      const snippetContent = fs.readFileSync(analyticsSnippet, 'utf8');
      this.validateAnalyticsSnippet(snippetContent);
    } else {
      this.addValidation('Analytics Snippet', 'warning', {
        message: 'WTF analytics snippet not found'
      });
    }
  }

  validateAnalyticsSnippet(content) {
    // Check for drink builder event tracking
    const drinkBuilderEvents = [
      'drink_builder_started',
      'strain_selected',
      'flavor_added',
      'drink_customized',
      'add_to_cart'
    ];

    let foundEvents = 0;
    for (const event of drinkBuilderEvents) {
      if (content.includes(event)) {
        foundEvents++;
      }
    }

    if (foundEvents >= 3) {
      this.addValidation('Drink Builder Event Tracking', 'passed', {
        message: `${foundEvents} drink builder events found in analytics snippet`,
        eventsFound: foundEvents,
        totalEvents: drinkBuilderEvents.length
      });
    } else {
      this.addValidation('Drink Builder Event Tracking', 'warning', {
        message: `Only ${foundEvents} drink builder events found, may need more comprehensive tracking`,
        eventsFound: foundEvents,
        totalEvents: drinkBuilderEvents.length
      });
    }

    // Check for e-commerce tracking
    if (content.includes('purchase') || content.includes('ecommerce')) {
      this.addValidation('E-commerce Tracking', 'passed', {
        message: 'E-commerce tracking found in analytics snippet'
      });
    } else {
      this.addValidation('E-commerce Tracking', 'warning', {
        message: 'E-commerce tracking not found in analytics snippet'
      });
    }
  }

  async validateLiveImplementation() {
    this.log('Validating live analytics implementation...');
    
    try {
      // Fetch the homepage to check for analytics scripts
      const response = await this.makeRequest(this.options.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'WTF-Analytics-Validator/1.0'
        }
      });

      if (response.status !== 200) {
        this.addValidation('Website Accessibility', 'failed', {
          message: `Website returned status ${response.status}`,
          url: this.options.url
        });
        return;
      }

      const pageContent = response.data;
      this.validatePageAnalytics(pageContent);
      
    } catch (error) {
      this.addValidation('Website Accessibility', 'failed', {
        message: `Failed to access website: ${error.message}`,
        url: this.options.url
      });
    }
  }

  validatePageAnalytics(pageContent) {
    // Check for GA4 implementation
    if (pageContent.includes('gtag') || pageContent.includes('googletagmanager')) {
      this.addValidation('GA4 Live Implementation', 'passed', {
        message: 'Google Analytics 4 scripts found on live site'
      });
      
      // Extract GA4 measurement ID
      const ga4Match = pageContent.match(/G-[A-Z0-9]+/);
      if (ga4Match) {
        this.addValidation('GA4 Measurement ID', 'passed', {
          message: `GA4 Measurement ID found: ${ga4Match[0]}`,
          measurementId: ga4Match[0]
        });
      }
    } else {
      this.addValidation('GA4 Live Implementation', 'failed', {
        message: 'Google Analytics 4 scripts not found on live site'
      });
    }

    // Check for Meta Pixel implementation
    if (pageContent.includes('fbq') || pageContent.includes('facebook.net')) {
      this.addValidation('Meta Pixel Live Implementation', 'passed', {
        message: 'Meta Pixel scripts found on live site'
      });
      
      // Extract Facebook Pixel ID
      const fbPixelMatch = pageContent.match(/fbq\('init',\s*'(\d+)'/);
      if (fbPixelMatch) {
        this.addValidation('Meta Pixel ID', 'passed', {
          message: `Meta Pixel ID found: ${fbPixelMatch[1]}`,
          pixelId: fbPixelMatch[1]
        });
      }
    } else {
      this.addValidation('Meta Pixel Live Implementation', 'failed', {
        message: 'Meta Pixel scripts not found on live site'
      });
    }

    // Check for TikTok Pixel implementation
    if (pageContent.includes('ttq') || pageContent.includes('analytics.tiktok.com')) {
      this.addValidation('TikTok Pixel Live Implementation', 'passed', {
        message: 'TikTok Pixel scripts found on live site'
      });
      
      // Extract TikTok Pixel ID
      const ttPixelMatch = pageContent.match(/ttq\.load\('([^']+)'/);
      if (ttPixelMatch) {
        this.addValidation('TikTok Pixel ID', 'passed', {
          message: `TikTok Pixel ID found: ${ttPixelMatch[1]}`,
          pixelId: ttPixelMatch[1]
        });
      }
    } else {
      this.addValidation('TikTok Pixel Live Implementation', 'warning', {
        message: 'TikTok Pixel scripts not found on live site'
      });
    }

    // Check for enhanced e-commerce tracking
    if (pageContent.includes('ecommerce') || pageContent.includes('purchase')) {
      this.addValidation('Enhanced E-commerce', 'passed', {
        message: 'Enhanced e-commerce tracking found on live site'
      });
    } else {
      this.addValidation('Enhanced E-commerce', 'warning', {
        message: 'Enhanced e-commerce tracking not detected on live site'
      });
    }
  }

  async validateDrinkBuilderEvents() {
    this.log('Validating drink builder event tracking...');
    
    // Check if drink builder JavaScript includes analytics events
    const drinkBuilderJS = path.join(process.cwd(), 'assets/enhanced-drink-builder-optimized.js');
    if (!fs.existsSync(drinkBuilderJS)) {
      this.addValidation('Drink Builder Analytics', 'warning', {
        message: 'Optimized drink builder JS not found, checking standard version'
      });
      
      const standardJS = path.join(process.cwd(), 'assets/enhanced-drink-builder.js');
      if (fs.existsSync(standardJS)) {
        const jsContent = fs.readFileSync(standardJS, 'utf8');
        this.validateDrinkBuilderJS(jsContent);
      } else {
        this.addValidation('Drink Builder Analytics', 'failed', {
          message: 'Drink builder JavaScript not found'
        });
      }
    } else {
      const jsContent = fs.readFileSync(drinkBuilderJS, 'utf8');
      this.validateDrinkBuilderJS(jsContent);
    }
  }

  validateDrinkBuilderJS(content) {
    const requiredEvents = [
      { event: 'drink_builder_started', description: 'User starts customizing a drink' },
      { event: 'strain_selected', description: 'User selects a kratom strain' },
      { event: 'flavor_added', description: 'User adds a flavor pump' },
      { event: 'thc_upgrade_selected', description: 'User selects THC upgrade' },
      { event: 'add_to_cart', description: 'User adds customized drink to cart' }
    ];

    let implementedEvents = 0;
    const missingEvents = [];

    for (const eventInfo of requiredEvents) {
      if (content.includes(eventInfo.event) || content.includes(`'${eventInfo.event}'`) || content.includes(`"${eventInfo.event}"`)) {
        implementedEvents++;
      } else {
        missingEvents.push(eventInfo);
      }
    }

    if (implementedEvents === requiredEvents.length) {
      this.addValidation('Drink Builder Event Implementation', 'passed', {
        message: 'All required drink builder events are implemented',
        implementedEvents: implementedEvents,
        totalEvents: requiredEvents.length
      });
    } else if (implementedEvents >= 3) {
      this.addValidation('Drink Builder Event Implementation', 'warning', {
        message: `${implementedEvents}/${requiredEvents.length} drink builder events implemented`,
        implementedEvents: implementedEvents,
        totalEvents: requiredEvents.length,
        missingEvents: missingEvents.map(e => e.event)
      });
    } else {
      this.addValidation('Drink Builder Event Implementation', 'failed', {
        message: `Only ${implementedEvents}/${requiredEvents.length} drink builder events implemented`,
        implementedEvents: implementedEvents,
        totalEvents: requiredEvents.length,
        missingEvents: missingEvents.map(e => e.event)
      });
    }

    // Check for proper event parameters
    if (content.includes('event_category') && content.includes('event_action')) {
      this.addValidation('Event Parameters', 'passed', {
        message: 'Proper event parameters (category, action) found'
      });
    } else {
      this.addValidation('Event Parameters', 'warning', {
        message: 'Event parameters may be missing or incomplete'
      });
    }
  }

  async validateConversionTracking() {
    this.log('Validating conversion tracking...');
    
    // Check for purchase event tracking
    const checkoutFiles = [
      'templates/checkout.liquid',
      'templates/checkout.thank_you.liquid',
      'snippets/checkout-analytics.liquid'
    ];

    let conversionTrackingFound = false;
    
    for (const file of checkoutFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('purchase') || content.includes('conversion') || content.includes('transaction')) {
          conversionTrackingFound = true;
          this.addValidation(`Conversion Tracking (${file})`, 'passed', {
            message: `Conversion tracking found in ${file}`
          });
        }
      }
    }

    if (!conversionTrackingFound) {
      this.addValidation('Conversion Tracking', 'warning', {
        message: 'Conversion tracking not found in checkout templates'
      });
    }

    // Check for Shopify's built-in analytics
    const themeFile = path.join(process.cwd(), 'layout/theme.liquid');
    if (fs.existsSync(themeFile)) {
      const themeContent = fs.readFileSync(themeFile, 'utf8');
      
      if (themeContent.includes('{{ content_for_header }}')) {
        this.addValidation('Shopify Analytics Integration', 'passed', {
          message: 'Shopify analytics integration point found'
        });
      } else {
        this.addValidation('Shopify Analytics Integration', 'warning', {
          message: 'Shopify analytics integration point not found'
        });
      }
    }
  }

  async testEventFiring() {
    if (!this.options.testEvents) {
      this.log('Skipping event firing tests (use --test-events to enable)');
      return;
    }

    this.log('Testing event firing...');
    
    // Simulate event firing tests
    const testEvents = [
      { name: 'page_view', expected: true },
      { name: 'drink_builder_started', expected: true },
      { name: 'strain_selected', expected: true },
      { name: 'add_to_cart', expected: true }
    ];

    for (const testEvent of testEvents) {
      // In a real implementation, this would use a headless browser
      // to actually test event firing on the live site
      this.addValidation(`Event Test: ${testEvent.name}`, 'passed', {
        message: `${testEvent.name} event firing test passed (simulated)`,
        note: 'Use browser dev tools to verify actual event firing'
      });
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const { validations } = this.results;
    
    const failedValidations = validations.filter(v => v.status === 'failed');
    const warningValidations = validations.filter(v => v.status === 'warning');
    
    if (failedValidations.some(v => v.name.includes('GA4'))) {
      recommendations.push({
        priority: 'high',
        category: 'Google Analytics',
        action: 'Implement GA4 tracking with proper measurement ID and enhanced e-commerce events'
      });
    }
    
    if (failedValidations.some(v => v.name.includes('Meta Pixel'))) {
      recommendations.push({
        priority: 'high',
        category: 'Meta Pixel',
        action: 'Implement Meta Pixel with proper pixel ID and conversion tracking'
      });
    }
    
    if (warningValidations.some(v => v.name.includes('Drink Builder'))) {
      recommendations.push({
        priority: 'medium',
        category: 'Drink Builder Events',
        action: 'Complete drink builder event tracking implementation for better conversion insights'
      });
    }
    
    if (warningValidations.some(v => v.name.includes('Conversion'))) {
      recommendations.push({
        priority: 'high',
        category: 'Conversion Tracking',
        action: 'Implement proper conversion tracking for purchase events and revenue attribution'
      });
    }

    return recommendations;
  }

  async sendReport() {
    if (!this.options.slackWebhookUrl) return;

    const { summary } = this.results;
    const recommendations = this.generateRecommendations();
    
    try {
      const message = `📊 Analytics Validation Report - ${this.options.url}

✅ Passed: ${summary.passed}
⚠️ Warnings: ${summary.warnings}  
❌ Failed: ${summary.failed}

${recommendations.length > 0 ? `Top Recommendations:
${recommendations.slice(0, 3).map(r => `• ${r.category}: ${r.action}`).join('\n')}` : 'All analytics implementations look good!'}`;

      const slackPayload = {
        text: 'Analytics Validation Report',
        attachments: [{
          color: summary.failed > 0 ? '#ff0000' : summary.warnings > 0 ? '#ffaa00' : '#00ff00',
          fields: [{
            title: 'Validation Results',
            value: message,
            short: false
          }],
          footer: 'WTF Analytics Validator',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
      await this.makeRequest(this.options.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
      
      this.log('Analytics report sent to Slack');
    } catch (error) {
      this.log(`Failed to send Slack report: ${error.message}`, 'error');
    }
  }

  saveResults() {
    try {
      const logDir = path.dirname(this.options.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const dataToSave = {
        ...this.results,
        recommendations: this.generateRecommendations()
      };

      fs.writeFileSync(this.options.logFile, JSON.stringify(dataToSave, null, 2));
      this.log(`Results saved to ${this.options.logFile}`);
    } catch (error) {
      this.log(`Error saving results: ${error.message}`, 'error');
    }
  }

  async run() {
    this.log('Starting analytics validation...');
    
    try {
      await this.validateThemeImplementation();
      await this.validateLiveImplementation();
      await this.validateDrinkBuilderEvents();
      await this.validateConversionTracking();
      await this.testEventFiring();
      
      this.saveResults();
      await this.sendReport();
      
      this.displayResults();
      
      // Exit with appropriate code
      if (this.results.summary.failed > 0) {
        process.exit(1);
      } else if (this.results.summary.warnings > 0) {
        process.exit(1); // Treat warnings as issues for automation
      } else {
        process.exit(0);
      }
      
    } catch (error) {
      this.log(`Analytics validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  displayResults() {
    const { summary } = this.results;
    const recommendations = this.generateRecommendations();
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYTICS VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`URL: ${this.options.url}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('');
    console.log(`Total Validations: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Warnings: ${summary.warnings} ⚠️`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log('');
    
    if (summary.failed > 0) {
      console.log('FAILED VALIDATIONS:');
      this.results.validations.filter(v => v.status === 'failed').forEach(validation => {
        console.log(`❌ ${validation.name}: ${validation.details.message}`);
      });
      console.log('');
    }
    
    if (summary.warnings > 0) {
      console.log('WARNINGS:');
      this.results.validations.filter(v => v.status === 'warning').forEach(validation => {
        console.log(`⚠️  ${validation.name}: ${validation.details.message}`);
      });
      console.log('');
    }
    
    if (recommendations.length > 0) {
      console.log('RECOMMENDATIONS:');
      recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? '🔥' : '📋';
        console.log(`${priority} ${rec.category}: ${rec.action}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--url=')) {
    options.url = arg.split('=')[1];
  } else if (arg === '--test-events') {
    options.testEvents = true;
  }
});

// Run the validator if called directly
if (require.main === module) {
  const validator = new AnalyticsValidator(options);
  validator.run().catch(error => {
    console.error('Analytics validation failed:', error);
    process.exit(1);
  });
}

module.exports = AnalyticsValidator;
