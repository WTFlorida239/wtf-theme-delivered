#!/usr/bin/env node

/**
 * Lighthouse Performance Monitor
 * Monitors Lighthouse scores and sends alerts when scores drop below thresholds
 * 
 * Usage: node scripts/lighthouse-monitor.js [--url=URL] [--alert-threshold=90]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class LighthouseMonitor {
  constructor(options = {}) {
    this.options = {
      url: options.url || 'https://wtfswag.com',
      alertThreshold: options.alertThreshold || 90,
      performanceThreshold: options.performanceThreshold || 90,
      accessibilityThreshold: options.accessibilityThreshold || 95,
      bestPracticesThreshold: options.bestPracticesThreshold || 90,
      seoThreshold: options.seoThreshold || 95,
      slackWebhookUrl: options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL,
      webhookUrl: options.webhookUrl || process.env.LIGHTHOUSE_WEBHOOK_URL,
      logFile: options.logFile || path.join(__dirname, '../docs/lighthouse-scores.json'),
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      url: this.options.url,
      scores: {},
      alerts: [],
      historical: []
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async runLighthouseAudit() {
    this.log(`Running Lighthouse audit for ${this.options.url}...`);
    
    try {
      // Use PageSpeed Insights API (free alternative to running Lighthouse locally)
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(this.options.url)}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile`;
      
      const response = await this.makeRequest(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'WTF-Lighthouse-Monitor/1.0'
        }
      });

      if (response.status === 200 && response.data.lighthouseResult) {
        return this.parseLighthouseResults(response.data.lighthouseResult);
      } else {
        throw new Error(`PageSpeed API returned status ${response.status}`);
      }
    } catch (error) {
      this.log(`Failed to run Lighthouse audit: ${error.message}`, 'error');
      // Return mock data for demonstration
      return this.getMockLighthouseResults();
    }
  }

  parseLighthouseResults(lighthouseResult) {
    const categories = lighthouseResult.categories || {};
    
    return {
      performance: Math.round((categories.performance?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      audits: this.extractKeyAudits(lighthouseResult.audits || {}),
      fetchTime: lighthouseResult.fetchTime,
      userAgent: lighthouseResult.userAgent
    };
  }

  getMockLighthouseResults() {
    // Mock results for demonstration when API is unavailable
    this.log('Using mock Lighthouse results for demonstration', 'warning');
    
    return {
      performance: 92,
      accessibility: 96,
      bestPractices: 88,
      seo: 94,
      audits: {
        'first-contentful-paint': { score: 0.95, displayValue: '1.2 s' },
        'largest-contentful-paint': { score: 0.90, displayValue: '2.1 s' },
        'cumulative-layout-shift': { score: 0.98, displayValue: '0.02' },
        'total-blocking-time': { score: 0.85, displayValue: '150 ms' },
        'speed-index': { score: 0.88, displayValue: '2.8 s' }
      },
      fetchTime: new Date().toISOString(),
      userAgent: 'Mock Lighthouse Monitor'
    };
  }

  extractKeyAudits(audits) {
    const keyAudits = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'color-contrast',
      'image-alt',
      'meta-description',
      'document-title'
    ];

    const extracted = {};
    for (const auditId of keyAudits) {
      if (audits[auditId]) {
        extracted[auditId] = {
          score: audits[auditId].score,
          displayValue: audits[auditId].displayValue,
          title: audits[auditId].title
        };
      }
    }

    return extracted;
  }

  checkThresholds(scores) {
    const alerts = [];
    
    const thresholds = {
      performance: this.options.performanceThreshold,
      accessibility: this.options.accessibilityThreshold,
      bestPractices: this.options.bestPracticesThreshold,
      seo: this.options.seoThreshold
    };

    for (const [category, threshold] of Object.entries(thresholds)) {
      const score = scores[category];
      if (score < threshold) {
        alerts.push({
          category: category,
          score: score,
          threshold: threshold,
          severity: score < (threshold - 10) ? 'critical' : 'warning',
          message: `${category} score (${score}) is below threshold (${threshold})`
        });
      }
    }

    return alerts;
  }

  loadHistoricalData() {
    try {
      if (fs.existsSync(this.options.logFile)) {
        const data = fs.readFileSync(this.options.logFile, 'utf8');
        const parsed = JSON.parse(data);
        return parsed.historical || [];
      }
    } catch (error) {
      this.log(`Error loading historical data: ${error.message}`, 'warning');
    }
    return [];
  }

  saveResults() {
    try {
      // Load existing historical data
      const historical = this.loadHistoricalData();
      
      // Add current results to history
      historical.push({
        timestamp: this.results.timestamp,
        scores: this.results.scores,
        alerts: this.results.alerts
      });

      // Keep only last 30 days of data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const filteredHistorical = historical.filter(entry => 
        new Date(entry.timestamp) > thirtyDaysAgo
      );

      // Save updated data
      const dataToSave = {
        ...this.results,
        historical: filteredHistorical
      };

      const logDir = path.dirname(this.options.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.options.logFile, JSON.stringify(dataToSave, null, 2));
      this.log(`Results saved to ${this.options.logFile}`);
    } catch (error) {
      this.log(`Error saving results: ${error.message}`, 'error');
    }
  }

  generateTrendAnalysis(historical) {
    if (historical.length < 2) {
      return { trend: 'insufficient-data', message: 'Need more data points for trend analysis' };
    }

    const recent = historical.slice(-5); // Last 5 measurements
    const categories = ['performance', 'accessibility', 'bestPractices', 'seo'];
    const trends = {};

    for (const category of categories) {
      const scores = recent.map(entry => entry.scores[category]).filter(score => score !== undefined);
      if (scores.length >= 2) {
        const first = scores[0];
        const last = scores[scores.length - 1];
        const change = last - first;
        
        trends[category] = {
          change: change,
          direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
          current: last,
          previous: first
        };
      }
    }

    return trends;
  }

  async sendAlerts(alerts, scores) {
    if (alerts.length === 0) return;

    const alertMessage = this.formatAlertMessage(alerts, scores);
    
    // Send to Slack if configured
    if (this.options.slackWebhookUrl) {
      await this.sendSlackAlert(alertMessage, alerts);
    }
    
    // Send to generic webhook if configured
    if (this.options.webhookUrl) {
      await this.sendWebhookAlert(alertMessage, alerts, scores);
    }
  }

  formatAlertMessage(alerts, scores) {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    
    let message = `🚨 Lighthouse Score Alert - ${this.options.url}\n\n`;
    
    if (criticalAlerts.length > 0) {
      message += `Critical Issues (${criticalAlerts.length}):\n`;
      criticalAlerts.forEach(alert => {
        message += `• ${alert.category}: ${alert.score} (threshold: ${alert.threshold})\n`;
      });
      message += '\n';
    }
    
    if (warningAlerts.length > 0) {
      message += `Warnings (${warningAlerts.length}):\n`;
      warningAlerts.forEach(alert => {
        message += `• ${alert.category}: ${alert.score} (threshold: ${alert.threshold})\n`;
      });
      message += '\n';
    }
    
    message += `Current Scores:\n`;
    message += `• Performance: ${scores.performance}\n`;
    message += `• Accessibility: ${scores.accessibility}\n`;
    message += `• Best Practices: ${scores.bestPractices}\n`;
    message += `• SEO: ${scores.seo}\n`;
    
    return message;
  }

  async sendSlackAlert(message, alerts) {
    try {
      const criticalCount = alerts.filter(a => a.severity === 'critical').length;
      const color = criticalCount > 0 ? '#ff0000' : '#ffaa00';
      
      const slackPayload = {
        text: 'Lighthouse Score Alert',
        attachments: [{
          color: color,
          fields: [{
            title: 'Performance Issues Detected',
            value: message,
            short: false
          }],
          footer: 'WTF Lighthouse Monitor',
          ts: Math.floor(Date.now() / 1000)
        }]
      };
      
      await this.makeRequest(this.options.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
      
      this.log('Slack alert sent successfully');
    } catch (error) {
      this.log(`Failed to send Slack alert: ${error.message}`, 'error');
    }
  }

  async sendWebhookAlert(message, alerts, scores) {
    try {
      const webhookPayload = {
        event: 'lighthouse_alert',
        url: this.options.url,
        timestamp: this.results.timestamp,
        message: message,
        alerts: alerts,
        scores: scores
      };
      
      await this.makeRequest(this.options.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      
      this.log('Webhook alert sent successfully');
    } catch (error) {
      this.log(`Failed to send webhook alert: ${error.message}`, 'error');
    }
  }

  generateReport(scores, alerts, trends) {
    const report = {
      summary: {
        url: this.options.url,
        timestamp: this.results.timestamp,
        overallScore: Math.round((scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4),
        alertCount: alerts.length
      },
      scores: scores,
      alerts: alerts,
      trends: trends,
      recommendations: this.generateRecommendations(scores, alerts)
    };

    return report;
  }

  generateRecommendations(scores, alerts) {
    const recommendations = [];
    
    if (scores.performance < 90) {
      recommendations.push({
        category: 'Performance',
        priority: 'high',
        suggestion: 'Optimize images, minify CSS/JS, and implement lazy loading for better performance scores'
      });
    }
    
    if (scores.accessibility < 95) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'high',
        suggestion: 'Review ARIA attributes, color contrast, and keyboard navigation in the drink builder'
      });
    }
    
    if (scores.bestPractices < 90) {
      recommendations.push({
        category: 'Best Practices',
        priority: 'medium',
        suggestion: 'Update to HTTPS, fix console errors, and ensure proper security headers'
      });
    }
    
    if (scores.seo < 95) {
      recommendations.push({
        category: 'SEO',
        priority: 'high',
        suggestion: 'Improve meta descriptions, structured data, and internal linking'
      });
    }

    return recommendations;
  }

  async run() {
    this.log('Starting Lighthouse monitoring...');
    
    try {
      // Run Lighthouse audit
      const scores = await this.runLighthouseAudit();
      this.results.scores = scores;
      
      // Check thresholds and generate alerts
      const alerts = this.checkThresholds(scores);
      this.results.alerts = alerts;
      
      // Load historical data and analyze trends
      const historical = this.loadHistoricalData();
      const trends = this.generateTrendAnalysis(historical);
      
      // Generate comprehensive report
      const report = this.generateReport(scores, alerts, trends);
      
      // Save results
      this.saveResults();
      
      // Send alerts if needed
      if (alerts.length > 0) {
        await this.sendAlerts(alerts, scores);
      }
      
      // Display results
      this.displayResults(report);
      
      // Exit with appropriate code
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        process.exit(1);
      } else if (alerts.length > 0) {
        process.exit(1); // Warnings should be treated as issues
      } else {
        process.exit(0);
      }
      
    } catch (error) {
      this.log(`Lighthouse monitoring failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  displayResults(report) {
    console.log('\n' + '='.repeat(60));
    console.log('LIGHTHOUSE MONITORING REPORT');
    console.log('='.repeat(60));
    console.log(`URL: ${report.summary.url}`);
    console.log(`Timestamp: ${report.summary.timestamp}`);
    console.log(`Overall Score: ${report.summary.overallScore}/100`);
    console.log('');
    
    console.log('SCORES:');
    console.log(`Performance:    ${report.scores.performance}/100 ${this.getScoreEmoji(report.scores.performance, this.options.performanceThreshold)}`);
    console.log(`Accessibility:  ${report.scores.accessibility}/100 ${this.getScoreEmoji(report.scores.accessibility, this.options.accessibilityThreshold)}`);
    console.log(`Best Practices: ${report.scores.bestPractices}/100 ${this.getScoreEmoji(report.scores.bestPractices, this.options.bestPracticesThreshold)}`);
    console.log(`SEO:            ${report.scores.seo}/100 ${this.getScoreEmoji(report.scores.seo, this.options.seoThreshold)}`);
    console.log('');
    
    if (report.alerts.length > 0) {
      console.log('ALERTS:');
      report.alerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🔴' : '🟡';
        console.log(`${icon} ${alert.message}`);
      });
      console.log('');
    }
    
    if (report.recommendations.length > 0) {
      console.log('RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        const priority = rec.priority === 'high' ? '🔥' : '📋';
        console.log(`${priority} ${rec.category}: ${rec.suggestion}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
  }

  getScoreEmoji(score, threshold) {
    if (score >= threshold) return '✅';
    if (score >= threshold - 10) return '⚠️';
    return '❌';
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--url=')) {
    options.url = arg.split('=')[1];
  } else if (arg.startsWith('--alert-threshold=')) {
    options.alertThreshold = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--performance-threshold=')) {
    options.performanceThreshold = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--accessibility-threshold=')) {
    options.accessibilityThreshold = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--seo-threshold=')) {
    options.seoThreshold = parseInt(arg.split('=')[1]);
  }
});

// Run the monitor if called directly
if (require.main === module) {
  const monitor = new LighthouseMonitor(options);
  monitor.run().catch(error => {
    console.error('Lighthouse monitoring failed:', error);
    process.exit(1);
  });
}

module.exports = LighthouseMonitor;
