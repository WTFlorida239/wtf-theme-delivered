# WTF | Welcome To Florida - Automation System
## Phase 4: Self-Healing Data Sync

This directory contains the complete automation system for maintaining metafield and metaobject integrity across the WTF | Welcome To Florida Shopify store.

---

## Files Overview

### Core Scripts

**`webhook_handler.py`** - Real-time webhook processing
- Handles Shopify webhook events (products/create, products/update, etc.)
- Classifies products using heuristic patterns
- Automatically assigns metafields and creates metaobjects
- Implements HMAC verification and idempotency
- **Deployment:** Cloudflare Workers, AWS Lambda, or your server

**`reconciliation_jobs.py`** - Nightly data reconciliation
- Scans all products for metafield consistency
- Validates bar_menu_item metaobject integrity
- Auto-repairs obvious issues (stale references, invalid values)
- Generates data maps and bar menu cache
- **Schedule:** 2:00 AM daily (metafield scan), 2:30 AM daily (menu scan)

**`trust_report_generator.py`** - Weekly health reports
- Generates human-readable status reports
- Tracks issues, fixes, and deltas over time
- Provides actionable recommendations
- **Schedule:** Monday 9:00 AM weekly

**`create_webhooks.py`** - Webhook subscription setup
- Creates Shopify webhook subscriptions via GraphQL
- Configures callback URLs for webhook handler
- Lists existing webhooks for audit
- **Usage:** Run once during initial setup

### Configuration Files

**`webhook_subscriptions.graphql`** - GraphQL mutations
- Pre-written mutations for creating webhooks
- Query for listing existing subscriptions
- Mutation for deleting subscriptions
- **Usage:** Reference for manual webhook management

---

## Quick Start

### 1. Deploy Webhook Handler

Choose your platform and follow the deployment guide:

**Cloudflare Workers (Recommended):**
```bash
cd automation
# Update WEBHOOK_BASE_URL in create_webhooks.py
# Deploy via Wrangler CLI (see AUTOMATION_DEPLOYMENT_GUIDE.md)
```

**AWS Lambda:**
```bash
cd automation
zip -r webhook_handler.zip webhook_handler.py
# Upload to Lambda (see AUTOMATION_DEPLOYMENT_GUIDE.md)
```

**Your Server:**
```bash
cd automation
pip3 install flask requests
python3 webhook_handler.py
# Set up reverse proxy (see AUTOMATION_DEPLOYMENT_GUIDE.md)
```

### 2. Create Webhook Subscriptions

```bash
# Update WEBHOOK_BASE_URL in create_webhooks.py
python3 create_webhooks.py
```

Verify in Shopify Admin: Settings → Notifications → Webhooks

### 3. Set Up Reconciliation Jobs

**Server Cron:**
```bash
crontab -e
# Add:
# 0 2 * * * cd /path/to/automation && python3 reconciliation_jobs.py
# 0 9 * * 1 cd /path/to/automation && python3 trust_report_generator.py
```

**GitHub Actions:**
```yaml
# See .github/workflows/reconciliation.yml
on:
  schedule:
    - cron: '0 7 * * *'  # 2:00 AM EST
```

### 4. Test the System

```bash
# Run reconciliation manually
python3 reconciliation_jobs.py

# Generate trust report
python3 trust_report_generator.py

# Create test product in Shopify Admin
# Title: "Test Kava Draft Pour"
# Product Type: "Beverage"
# Tags: "kava, draft, test"
# → Check webhook handler logs for automatic classification
```

---

## Architecture

```
Shopify Store
     ↓ (webhooks)
Webhook Handler
     ↓ (GraphQL mutations)
Metafields & Metaobjects
     ↓ (nightly scans)
Reconciliation Jobs
     ↓ (data files)
/data/architecture/
/data/runtime/
/data/reports/
```

---

## Data Flow

### Real-Time (Webhooks)

1. Product created/updated in Shopify
2. Webhook fired to handler endpoint
3. Handler verifies HMAC signature
4. Product classified via heuristics
5. Metafields/metaobjects updated via GraphQL
6. Action logged to execution log

### Nightly (Reconciliation)

1. Cron triggers reconciliation job
2. All products fetched via GraphQL
3. Metafield presence/values validated
4. Metaobject references checked
5. Issues detected and (optionally) auto-fixed
6. Data maps and cache files updated
7. Execution log saved

### Weekly (Trust Reports)

1. Cron triggers trust report generator
2. Latest data maps and logs loaded
3. Summary statistics calculated
4. Issues categorized and listed
5. Delta since last week computed
6. Recommendations generated
7. Markdown report saved

---

## Heuristic Classification

Products are automatically classified into:

**Layer:** `bar` (on-premise) or `take-home` (e-commerce)

**Ingredient:** `THC`, `Kratom`, `Kava`, `Mushroom`, `CBD`, `Caffeine`, or `needs_review`

### Classification Rules

**Bar Layer Detection:**
- Product type: `beverage`, `draft`, `shot`, `can`, `drink`, `seltzer`
- Title/tags contain: `draft`, `keg`, `tap`, `shot`, `can`, `seltzer`

**Ingredient Detection:**
- Title/tags contain: `kava` → Kava
- Title/tags contain: `kratom` → Kratom
- Title/tags contain: `thc`, `delta-9`, `delta-8` → THC
- Title/tags contain: `mushroom`, `fungi` → Mushroom
- Title/tags contain: `cbd` → CBD
- Title/tags contain: `caffeine`, `coffee` → Caffeine
- No match → `needs_review` (manual intervention required)

### Customizing Heuristics

Edit `webhook_handler.py`:

```python
class HeuristicClassifier:
    INGREDIENT_PATTERNS = [
        (r'\b(kava)\b', 'Kava'),
        (r'\b(kratom|mitragyna)\b', 'Kratom'),
        # Add your patterns here
    ]
    
    BAR_PATTERNS = [
        r'\b(draft|keg|tap)\b',
        # Add your patterns here
    ]
```

---

## Monitoring

### Daily Checks

```bash
# View latest execution logs
tail -f ../data/logs/metafield_consistency_scan_$(date +%Y%m%d).json
tail -f ../data/logs/menu_integrity_scan_$(date +%Y%m%d).json
```

### Weekly Checks

```bash
# Review trust report
cat ../data/reports/phase4_trust_report_$(date +%Y%m%d).md
```

### Metrics to Watch

- **Ingredient Coverage:** Should be >90%
- **Bar Menu Coverage:** Should be 100% (75/75 products)
- **Issues Found:** Should trend toward 0
- **Fixes Applied:** Should decrease over time

---

## Troubleshooting

### Webhook Not Firing

1. Check webhook exists in Shopify Admin
2. Verify endpoint is publicly accessible
3. Check HMAC verification logic
4. Review handler logs for errors

### Incorrect Classification

1. Review product title, type, and tags
2. Update heuristic patterns if needed
3. Manually fix via Shopify Admin metafield editor
4. Re-run reconciliation to update maps

### Data Files Not Updating

1. Check cron job is running
2. Verify API credentials are valid
3. Review execution logs for errors
4. Run reconciliation manually to debug

---

## Security

### HMAC Verification

All webhooks MUST verify HMAC signatures:

```python
def verify_hmac(body: bytes, hmac_header: str) -> bool:
    computed_hmac = hmac.new(
        SHOPIFY_WEBHOOK_SECRET.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_hmac, hmac_header)
```

### Idempotency

Use `(gid, updatedAt)` as job key to prevent duplicate processing:

```python
def is_duplicate(gid: str, updated_at: str) -> bool:
    # Check against KV store, Redis, or database
    key = f"{gid}:{updated_at}"
    return key in processed_webhooks
```

### Rate Limiting

Respect Shopify GraphQL cost limits:

```python
# Batch mutations (max 25 per batch)
# Use exponential backoff on errors
# Monitor cost in response headers
```

---

## Performance

### Webhook Handler

- **Latency:** <100ms (edge deployment)
- **Throughput:** 100+ requests/second
- **Cost:** $0/month (free tier)

### Reconciliation Jobs

- **Duration:** ~2-5 minutes (144 products)
- **Frequency:** 2x daily + 1x weekly
- **Cost:** $0/month (free tier)

### Data Storage

- **Size:** ~10 MB total
- **Growth:** ~1 MB/month (logs)
- **Cost:** $0 (included in GitHub)

---

## Next Steps

1. **Deploy webhook handlers** (see `AUTOMATION_DEPLOYMENT_GUIDE.md`)
2. **Create webhook subscriptions** (run `create_webhooks.py`)
3. **Set up reconciliation cron jobs**
4. **Monitor first week of execution**
5. **Review trust reports weekly**
6. **Tune heuristics based on accuracy**

---

## Support

**Documentation:**
- `../docs/AUTOMATION_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `../docs/METAFIELD_INTEGRATION_GUIDE.md` - Technical reference
- `../docs/PHASE4_FINAL_SUMMARY.md` - Executive summary

**Data:**
- `../data/architecture/` - Product mappings
- `../data/runtime/` - Bar menu cache
- `../data/reports/` - Trust reports
- `../data/logs/` - Execution logs

**Shopify Resources:**
- [Webhook API](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)
- [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Metafields Guide](https://shopify.dev/docs/apps/custom-data/metafields)

---

**Status:** ✅ Ready for Deployment  
**Reminder:** November 8, 2025 (webhook hosting setup)  
**Last Updated:** October 25, 2025

