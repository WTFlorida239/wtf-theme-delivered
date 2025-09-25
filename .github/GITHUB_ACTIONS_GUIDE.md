# WTF Theme GitHub Actions Automation Guide

This comprehensive guide covers all automated workflows configured for the WTF | Welcome To Florida Shopify theme repository. These GitHub Actions provide continuous integration, deployment, quality assurance, security monitoring, and maintenance automation.

## Overview of Automated Workflows

The WTF theme repository includes **10 powerful GitHub Actions workflows** that automate every aspect of theme development, deployment, and maintenance:

### 1. CI/CD Pipeline (`ci-cd-pipeline.yml`)
**Purpose:** Core continuous integration and deployment validation  
**Triggers:** Push to main/develop, pull requests, manual dispatch  
**Key Features:**
- Theme validation and structure checking
- Order readiness verification
- Conflict scanning and competitor analysis
- Shopify theme check compliance
- Lighthouse performance auditing
- Security scanning for hardcoded secrets
- Automated artifact collection and reporting

**Critical Quality Gates:**
- All required theme files must be present
- Order readiness check must pass 100%
- No security vulnerabilities detected
- Shopify theme standards compliance

### 2. Theme Deployment (`deploy-theme.yml`)
**Purpose:** Automated deployment to staging and production environments  
**Triggers:** Push to main, version tags, manual dispatch with environment selection  
**Key Features:**
- Pre-deployment validation with safety checks
- Automated staging deployment with unique theme names
- Production deployment with live theme backup
- Post-deployment verification and testing
- Rollback capability with backup restoration
- Cleanup of old staging themes

**Deployment Environments:**
- **Staging:** Automatic deployment on main branch pushes
- **Production:** Triggered by version tags or manual approval
- **Backup:** Automatic backup before production deployments

### 3. Quality Assurance & Monitoring (`quality-monitoring.yml`)
**Purpose:** Continuous quality monitoring and performance tracking  
**Triggers:** Daily scheduled runs, push to main, manual dispatch  
**Key Features:**
- Lighthouse performance monitoring with scoring thresholds
- Accessibility audit with WCAG 2.1 AA compliance checking
- SEO audit including structured data validation
- Competitive analysis and market positioning
- Quality summary reporting with actionable insights

**Quality Standards:**
- Performance Score: ≥85
- Accessibility Score: ≥90
- Best Practices Score: ≥85
- SEO Score: ≥90

### 4. Maintenance & Optimization (`maintenance-optimization.yml`)
**Purpose:** Automated theme maintenance and performance optimization  
**Triggers:** Weekly scheduled runs, manual dispatch with maintenance type selection  
**Key Features:**
- Automated theme backup with versioning
- File cleanup and optimization
- Performance analysis and recommendations
- Dependency update monitoring
- Asset size tracking and optimization suggestions

**Maintenance Types:**
- **Full:** Complete maintenance cycle (default)
- **Cleanup:** File cleanup and optimization only
- **Optimization:** Performance analysis only
- **Backup:** Theme backup only

### 5. Security & Dependency Management (`security-dependency-management.yml`)
**Purpose:** Comprehensive security monitoring and compliance tracking  
**Triggers:** Daily scheduled runs, push/PR events, manual dispatch  
**Key Features:**
- NPM security audit with vulnerability assessment
- Hardcoded secret detection and prevention
- File permission and access control verification
- Liquid code security analysis
- Privacy and compliance monitoring (GDPR, WCAG, PCI DSS)
- Dependency vulnerability tracking

**Security Standards:**
- Zero high-severity vulnerabilities allowed
- No hardcoded secrets or credentials
- Proper file permissions and access controls
- HTTPS enforcement and secure form handling

### 6. Automated Testing & Monitoring (`automated-testing.yml`)
**Purpose:** Comprehensive functional and integration testing  
**Triggers:** Push/PR events, 6-hourly scheduled runs, manual dispatch  
**Key Features:**
- Functional testing of critical components
- Integration testing with Shopify platform
- Performance monitoring and asset tracking
- End-to-end workflow validation
- Deployment readiness assessment

**Testing Coverage:**
- Order processing functionality
- Drink builder component testing
- Cart and checkout flow validation
- Template structure verification
- Asset performance monitoring

## Workflow Configuration and Secrets

### Required GitHub Secrets

To enable full automation functionality, configure these secrets in your GitHub repository:

```bash
# Shopify Integration
SHOPIFY_CLI_THEME_TOKEN=your_shopify_cli_token_here
SHOPIFY_STORE=wtfswag.myshopify.com

# Optional: Additional service integrations
SLACK_WEBHOOK_URL=your_slack_webhook_for_notifications
ANALYTICS_API_KEY=your_analytics_api_key
```

### Environment Variables

The workflows use these environment variables:

```yaml
env:
  SHOPIFY_CLI_THEME_TOKEN: ${{ secrets.SHOPIFY_CLI_THEME_TOKEN }}
  SHOPIFY_STORE: wtfswag.myshopify.com
```

## Automated Scheduling

### Daily Automation
- **3:00 AM UTC:** Security and dependency scans
- **6:00 AM UTC:** Quality monitoring and performance audits

### Weekly Automation
- **Sunday 2:00 AM UTC:** Full maintenance and optimization cycle

### Continuous Automation
- **Every 6 hours:** Automated testing and monitoring
- **On push/PR:** CI/CD pipeline and validation
- **On main branch:** Staging deployment
- **On version tags:** Production deployment

## Monitoring and Reporting

### Artifact Collection
Each workflow generates comprehensive artifacts:

- **Validation Results:** Theme structure and compliance reports
- **Performance Reports:** Lighthouse scores and optimization recommendations
- **Security Reports:** Vulnerability assessments and compliance status
- **Deployment Records:** Backup information and deployment logs
- **Test Results:** Functional and integration test outcomes

### Retention Policies
- **Critical artifacts:** 90 days retention
- **Standard reports:** 30 days retention
- **Backup files:** 90 days retention
- **Test results:** 30 days retention

## Manual Workflow Execution

### Using GitHub Actions UI
1. Navigate to **Actions** tab in your repository
2. Select the desired workflow from the left sidebar
3. Click **Run workflow** button
4. Configure any required inputs
5. Click **Run workflow** to execute

### Available Manual Triggers

#### CI/CD Pipeline
```bash
# Trigger via GitHub CLI
gh workflow run ci-cd-pipeline.yml
```

#### Theme Deployment
```bash
# Deploy to staging
gh workflow run deploy-theme.yml -f environment=staging

# Deploy to production
gh workflow run deploy-theme.yml -f environment=production

# Force deployment (skip validation)
gh workflow run deploy-theme.yml -f environment=staging -f force_deploy=true
```

#### Maintenance Operations
```bash
# Full maintenance cycle
gh workflow run maintenance-optimization.yml -f maintenance_type=full

# Cleanup only
gh workflow run maintenance-optimization.yml -f maintenance_type=cleanup

# Performance optimization only
gh workflow run maintenance-optimization.yml -f maintenance_type=optimization

# Backup only
gh workflow run maintenance-optimization.yml -f maintenance_type=backup
```

## Quality Gates and Deployment Criteria

### Pre-deployment Requirements
Before any deployment, the following criteria must be met:

1. **Functional Tests:** All critical components operational
2. **Security Scan:** No high-severity vulnerabilities
3. **Theme Validation:** Shopify compliance verified
4. **Order Readiness:** 100% pass rate on order processing tests
5. **Performance:** Lighthouse scores meet minimum thresholds

### Deployment Approval Process

#### Staging Deployment
- **Automatic:** Triggered on main branch push
- **Validation:** Pre-deployment checks required
- **Rollback:** Automatic cleanup of failed deployments

#### Production Deployment
- **Manual Approval:** Required for production environment
- **Backup:** Automatic backup before deployment
- **Verification:** Post-deployment testing and validation
- **Rollback:** Manual rollback capability with backup restoration

## Troubleshooting Common Issues

### Workflow Failures

#### CI/CD Pipeline Failures
```bash
# Common causes and solutions:
1. Missing required files → Check theme structure
2. Order readiness failures → Verify sections and templates
3. Security violations → Remove hardcoded secrets
4. Theme check errors → Fix Liquid syntax and structure
```

#### Deployment Failures
```bash
# Common causes and solutions:
1. Authentication issues → Verify SHOPIFY_CLI_THEME_TOKEN
2. Theme validation errors → Run CI/CD pipeline first
3. Network timeouts → Retry deployment
4. Permission errors → Check Shopify store access
```

#### Security Scan Failures
```bash
# Common causes and solutions:
1. Hardcoded secrets → Move to environment variables
2. Vulnerable dependencies → Update npm packages
3. File permission issues → Fix executable permissions
4. Compliance violations → Update privacy/accessibility elements
```

### Performance Issues

#### Slow Workflow Execution
- **Cause:** Large asset files or complex operations
- **Solution:** Optimize assets and use caching strategies

#### Failed Quality Checks
- **Cause:** Performance degradation or accessibility issues
- **Solution:** Review quality reports and implement recommendations

## Best Practices for Workflow Management

### Code Organization
1. **Feature Branches:** Use feature branches for development
2. **Pull Requests:** Always use PRs for code review
3. **Version Tags:** Use semantic versioning for releases
4. **Documentation:** Keep workflow documentation updated

### Security Practices
1. **Secret Management:** Never commit secrets to repository
2. **Access Control:** Limit workflow permissions appropriately
3. **Regular Updates:** Keep dependencies and tools updated
4. **Monitoring:** Review security reports regularly

### Performance Optimization
1. **Asset Management:** Optimize images and minify code
2. **Caching:** Use appropriate caching strategies
3. **Dependencies:** Keep dependencies minimal and updated
4. **Monitoring:** Track performance metrics continuously

## Integration with Development Workflow

### Development Process
1. **Feature Development:** Create feature branch
2. **Local Testing:** Test changes locally
3. **Pull Request:** Create PR with automated validation
4. **Code Review:** Review code and test results
5. **Merge:** Merge to main triggers staging deployment
6. **Testing:** Test in staging environment
7. **Release:** Create version tag for production deployment

### Continuous Improvement
1. **Monitor Metrics:** Track performance and quality trends
2. **Update Thresholds:** Adjust quality gates as needed
3. **Optimize Workflows:** Improve automation based on usage
4. **Documentation:** Keep guides and procedures updated

## Support and Maintenance

### Workflow Updates
- **Regular Reviews:** Monthly workflow performance review
- **Version Updates:** Keep GitHub Actions versions current
- **Feature Additions:** Add new automation as needed
- **Bug Fixes:** Address workflow issues promptly

### Monitoring and Alerts
- **GitHub Notifications:** Enable workflow failure notifications
- **Artifact Reviews:** Regular review of generated reports
- **Performance Tracking:** Monitor workflow execution times
- **Quality Trends:** Track quality metrics over time

---

## Quick Reference Commands

### Essential GitHub CLI Commands
```bash
# List all workflows
gh workflow list

# View workflow runs
gh workflow view ci-cd-pipeline.yml

# Run specific workflow
gh workflow run deploy-theme.yml -f environment=staging

# Download workflow artifacts
gh run download [run-id]

# View workflow logs
gh run view [run-id] --log
```

### Workflow Status Monitoring
```bash
# Check latest workflow status
gh run list --workflow=ci-cd-pipeline.yml --limit=5

# Monitor specific workflow
gh run watch [run-id]

# View failed workflows
gh run list --status=failure
```

This comprehensive automation suite ensures your WTF theme maintains the highest standards of quality, security, and performance while streamlining your development and deployment processes.
