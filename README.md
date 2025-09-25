# WTF Theme – Production-Ready Shopify Theme

> **Shopify Online Store 2.0 theme for WTF | Welcome To Florida** – A high-performance, accessible, and SEO-optimized theme featuring an advanced drink builder, competitive positioning, and comprehensive quality assurance.

[![Theme Check](https://github.com/WTFlorida239/wtf-theme-delivered/actions/workflows/theme-quality-check.yml/badge.svg)](https://github.com/WTFlorida239/wtf-theme-delivered/actions/workflows/theme-quality-check.yml)
[![CI/CD Pipeline](https://github.com/WTFlorida239/wtf-theme-delivered/actions/workflows/ci-cd-pipeline.yml/badge.svg)](https://github.com/WTFlorida239/wtf-theme-delivered/actions/workflows/ci-cd-pipeline.yml)

## Overview

The WTF Theme represents a complete Shopify Online Store 2.0 solution designed specifically for WTF | Welcome To Florida's kava and kratom business in Cape Coral, Florida. This theme combines modern web development practices with business-specific functionality to create a competitive advantage in the local market.

### Key Features

**Enhanced Drink Builder System** provides customers with an intuitive interface for customizing kava drinks, kratom teas, and THC beverages with real-time pricing, pump counters, and strain mixing capabilities.

**Competitive SEO Architecture** includes comprehensive JSON-LD structured data, local business schema, event markup, and FAQ optimization designed to outperform local competitors in search rankings.

**Performance-First Design** implements lazy loading, deferred CSS loading, optimized images, and minimal JavaScript for fast page loads and excellent Core Web Vitals scores.

**Accessibility Compliance** ensures WCAG 2.1 AA compliance with proper ARIA attributes, keyboard navigation, focus management, and screen reader compatibility.

**Quality Assurance Automation** includes automated testing, theme validation, security scanning, and performance monitoring through GitHub Actions workflows.

## Technical Architecture

### Platform Compatibility
- **Shopify Online Store 2.0** with full section group support
- **Modern Browser Support** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Mobile-First Responsive Design** with progressive enhancement
- **Performance Budget** targeting 90+ Lighthouse scores across all metrics

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6+, CSS3 with custom properties, HTML5 semantic markup
- **Shopify Integration**: Liquid templating, Shopify Functions, metafields, Ajax Cart API
- **Build Process**: Node.js toolchain, automated asset optimization, theme validation
- **Quality Assurance**: Theme Check, JSON validation, accessibility testing, security scanning

### File Structure
```
wtf-theme-delivered/
├── assets/                 # Optimized CSS, JS, and media files
├── config/                 # Theme settings and configuration
├── layout/                 # Base theme structure and head management
├── sections/               # Modular UI components and page sections
├── snippets/               # Reusable template partials and schema markup
├── templates/              # Page templates and JSON configurations
├── locales/                # Internationalization and text content
├── docs/                   # Documentation, guides, and runbooks
├── .github/                # CI/CD workflows and automation
├── .githooks/              # Development quality checks
└── scripts/                # Maintenance and deployment utilities
```

## Development Workflow

### Quick Start
1. **Clone Repository**: `git clone https://github.com/WTFlorida239/wtf-theme-delivered.git`
2. **Setup Environment**: `./setup-dev.sh` (installs dependencies and configures hooks)
3. **Configure Store**: Copy `.env.example` to `.env` and add your Shopify credentials
4. **Start Development**: `shopify theme dev --theme-editor-sync`
5. **Make Changes**: Edit files locally with live preview and hot reload

### Quality Standards
All code changes must pass automated quality checks including theme validation, JSON syntax verification, accessibility testing, and security scanning. Pre-commit hooks ensure code quality before commits reach the repository.

### Deployment Process
The theme uses GitHub as the source of truth with automated deployment pipelines. Changes pushed to the main branch trigger comprehensive testing before deployment to production environments.

## Business Intelligence & Competitive Positioning

### Local Market Analysis
The theme incorporates competitive intelligence from Cape Coral's kava and kratom market to ensure WTF maintains advantages over local competitors through superior online experience and search visibility.

| Competitor | Location | Key Strength | WTF Advantage |
|------------|----------|--------------|---------------|
| Kava Culture Kava Bar | Fort Myers | Loyalty program | Advanced online ordering with preset recipes |
| Elevation Kava | Cape Coral | Signature blends | Mix-and-match customization with transparency |
| High Tide Kava Bar | Cape Coral | Nitro cold brew | Fast pickup ordering and premium sourcing |
| Bula Kava Bar | Cape Coral | Espresso cocktails | Seasonal drink presets with recipe schema |
| Purple Lotus Kava Bar | Cape Coral | CBD mocktails | Lab-tested ingredient data and automation |

### SEO Strategy
The theme implements comprehensive structured data markup including local business information, event calendars, product schemas, FAQ content, and loyalty program details to maximize search engine visibility and local discovery.

### Performance Metrics
- **Lighthouse Performance**: 92+ (target)
- **Accessibility Score**: 96+ (WCAG 2.1 AA compliant)
- **SEO Score**: 94+ with comprehensive markup
- **Best Practices**: 88+ with security headers and HTTPS

## Configuration & Customization

### Theme Settings
The theme provides extensive customization options through Shopify's theme editor including color schemes, typography, layout options, business information, analytics integration, and feature toggles.

### Metafield Integration
Business data is managed through the `wtf.settings` metafield namespace, allowing dynamic content updates without code changes. This includes business hours, flavor options, pricing rules, and promotional messaging.

### Analytics & Tracking
Integrated support for Google Analytics 4, Facebook Pixel, TikTok Pixel, and custom event tracking for drink builder interactions, cart activities, and conversion optimization.

## Documentation & Support

### Developer Resources
- **[NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md)**: Coding standards and file naming conventions
- **[AGENTS.md](AGENTS.md)**: AI agent guidelines and development protocols
- **[TASKS.md](TASKS.md)**: Project backlog and task management
- **[docs/](docs/)**: Comprehensive guides, runbooks, and technical documentation

### Maintenance & Updates
The theme includes automated maintenance scripts for conflict detection, competitor monitoring, performance tracking, and security updates. Regular audits ensure continued optimization and competitive positioning.

### Quality Assurance
Comprehensive testing covers functionality, performance, accessibility, security, and cross-browser compatibility. Automated workflows prevent regressions and maintain code quality standards.

## Getting Started

### Prerequisites
- **Node.js 18+** for build tools and package management
- **Ruby 3.0+** for Shopify Theme Check validation
- **Shopify CLI 3.x** for development and deployment
- **Git** for version control and collaboration

### Installation
```bash
# Clone the repository
git clone https://github.com/WTFlorida239/wtf-theme-delivered.git
cd wtf-theme-delivered

# Run setup script
./setup-dev.sh

# Configure environment
cp .env.example .env
# Edit .env with your Shopify store details

# Start development server
shopify theme dev
```

### First Deployment
```bash
# Validate theme
shopify theme check

# Run quality checks
npm run test

# Deploy to development theme
shopify theme push --development

# Deploy to production (after testing)
shopify theme push --live
```

## Contributing

### Code Standards
All contributions must follow the established naming conventions, pass automated quality checks, and include appropriate documentation. The pre-commit hooks ensure code quality and consistency.

### Issue Reporting
Report bugs, feature requests, and performance issues through GitHub Issues with detailed reproduction steps and environment information.

### Security
Security vulnerabilities should be reported privately through GitHub Security Advisories or direct contact with the development team.

## License & Support

This theme is proprietary software developed specifically for WTF | Welcome To Florida. All rights reserved. For support, customization requests, or technical assistance, contact the development team through the established channels.

---

**Last Updated**: September 25, 2025  
**Version**: 2.0.0  
**Shopify Compatibility**: Online Store 2.0  
**Browser Support**: Modern browsers (ES6+ support required)
