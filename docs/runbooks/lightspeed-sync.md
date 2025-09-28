# Lightspeed POS Sync Runbook

## Overview

This document outlines the process for synchronizing inventory, products, and orders between WTF's Lightspeed POS system and the Shopify store. This ensures accurate inventory levels and consistent product information across all sales channels.

## Prerequisites

- Access to Lightspeed POS admin panel
- Shopify admin access with inventory management permissions
- API credentials for both systems
- Backup of current inventory data

## Sync Process

### 1. Pre-Sync Preparation

#### Backup Current Data
```bash
# Export current Shopify inventory
curl -X GET "https://wtfswag.myshopify.com/admin/api/2023-10/inventory_levels.json" \
  -H "X-Shopify-Access-Token: YOUR_TOKEN" > shopify_inventory_backup.json

# Export Lightspeed inventory
# Use Lightspeed API or export from admin panel
```

#### Verify SKU Parity
1. **Export SKU lists from both systems**
   - Lightspeed: Admin → Products → Export
   - Shopify: Products → Export

2. **Compare SKU formats**
   - Ensure consistent SKU naming conventions
   - Map any discrepancies in SKU formats
   - Document any products that exist in one system but not the other

3. **Create SKU mapping file**
   ```json
   {
     "sku_mappings": {
       "KAVA-PREM-001": "kava-premium-small",
       "KRATOM-GRN-002": "kratom-green-medium",
       "THC-DRINK-003": "thc-beverage-10mg"
     },
     "unmapped_lightspeed": [],
     "unmapped_shopify": []
   }
   ```

### 2. Sandbox Sync Execution

#### Environment Setup
```bash
# Set environment variables
export LIGHTSPEED_API_KEY="your_lightspeed_api_key"
export LIGHTSPEED_ACCOUNT_ID="your_account_id"
export SHOPIFY_API_KEY="your_shopify_api_key"
export SHOPIFY_PASSWORD="your_shopify_password"
export SHOPIFY_STORE_URL="wtfswag.myshopify.com"

# Test API connections
curl -X GET "https://api.lightspeedapp.com/API/Account/${LIGHTSPEED_ACCOUNT_ID}/Item.json" \
  -H "Authorization: Bearer ${LIGHTSPEED_API_KEY}"

curl -X GET "https://${SHOPIFY_STORE_URL}/admin/api/2023-10/products/count.json" \
  -H "X-Shopify-Access-Token: ${SHOPIFY_API_KEY}"
```

#### Sync Script Execution
```bash
# Run the sync script in dry-run mode first
node scripts/lightspeed-sync.js --dry-run --environment=sandbox

# Review the sync plan
cat sync-plan-$(date +%Y%m%d).json

# Execute the actual sync
node scripts/lightspeed-sync.js --environment=sandbox --confirm
```

### 3. Data Validation

#### Inventory Verification
1. **Compare inventory levels**
   ```sql
   -- Sample queries to verify sync
   SELECT sku, lightspeed_qty, shopify_qty, 
          ABS(lightspeed_qty - shopify_qty) as difference
   FROM sync_validation 
   WHERE ABS(lightspeed_qty - shopify_qty) > 0;
   ```

2. **Product information validation**
   - Verify product titles match
   - Check pricing consistency
   - Validate product descriptions and images
   - Confirm category assignments

3. **Generate validation report**
   ```bash
   node scripts/sync-validation.js --generate-report
   ```

### 4. Fallback Procedures

#### If Sync Fails

1. **Immediate Actions**
   - Stop any automated sync processes
   - Restore from backup if data corruption occurred
   - Document the failure point and error messages

2. **Manual Sync Process**
   ```bash
   # Export critical products manually
   node scripts/manual-sync.js --products="kava,kratom,thc-beverages"
   
   # Update inventory for high-priority items
   node scripts/priority-inventory-update.js
   ```

3. **Rollback Procedure**
   ```bash
   # Restore Shopify inventory from backup
   node scripts/restore-inventory.js --backup-file=shopify_inventory_backup.json
   
   # Verify rollback success
   node scripts/verify-rollback.js
   ```

### 5. Post-Sync Verification

#### Automated Checks
```bash
# Run comprehensive validation
npm run sync:validate

# Check for orphaned records
npm run sync:check-orphans

# Verify pricing consistency
npm run sync:check-pricing
```

#### Manual Verification Checklist
- [ ] Top 10 selling products have correct inventory
- [ ] New products from Lightspeed appear in Shopify
- [ ] Discontinued products are properly handled
- [ ] Pricing matches between systems
- [ ] Product images and descriptions are intact
- [ ] Categories and tags are preserved

### 6. Monitoring and Alerts

#### Set Up Monitoring
```javascript
// Monitor sync health
const syncMonitor = {
  checkInterval: 300000, // 5 minutes
  alertThresholds: {
    inventoryDiscrepancy: 5,
    syncLatency: 600000, // 10 minutes
    errorRate: 0.05 // 5%
  }
};
```

#### Alert Channels
- **Slack**: `#wtf-inventory-alerts`
- **Email**: ops@wtfswag.com
- **SMS**: Critical failures only

## Troubleshooting

### Common Issues

#### SKU Mismatch
```bash
# Find SKU discrepancies
node scripts/find-sku-mismatches.js

# Generate SKU mapping suggestions
node scripts/suggest-sku-mappings.js
```

#### API Rate Limits
```javascript
// Implement exponential backoff
const retryWithBackoff = async (apiCall, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

#### Inventory Sync Conflicts
1. **Identify conflict source**
   - Check recent sales in both systems
   - Verify manual adjustments
   - Review sync logs for errors

2. **Resolution priority**
   - Lightspeed POS is source of truth for in-store inventory
   - Shopify handles online-only products
   - Manual reconciliation for discrepancies > 10 units

### Error Codes

| Code | Description | Action |
|------|-------------|---------|
| LS001 | Lightspeed API timeout | Retry with exponential backoff |
| LS002 | SKU not found in Lightspeed | Check SKU mapping, create if needed |
| LS003 | Inventory lock conflict | Wait and retry, escalate if persistent |
| SH001 | Shopify rate limit exceeded | Implement request throttling |
| SH002 | Product variant limit reached | Consolidate variants or split products |
| SH003 | Invalid product data | Validate and clean data before sync |

## Maintenance Schedule

### Daily
- [ ] Monitor sync status dashboard
- [ ] Review error logs
- [ ] Verify critical product inventory

### Weekly
- [ ] Full inventory reconciliation
- [ ] Review SKU mapping accuracy
- [ ] Update sync configuration if needed

### Monthly
- [ ] Performance optimization review
- [ ] Update API credentials if needed
- [ ] Backup sync configuration

## Emergency Contacts

- **Primary**: Operations Manager - (239) 555-0100
- **Secondary**: IT Support - support@wtfswag.com
- **Escalation**: Store Manager - manager@wtfswag.com

## Documentation Updates

This runbook should be updated whenever:
- Sync process changes
- New error conditions are discovered
- API endpoints or credentials change
- Fallback procedures are modified

**Last Updated**: 2024-12-19
**Next Review**: 2025-01-19
**Version**: 1.0
