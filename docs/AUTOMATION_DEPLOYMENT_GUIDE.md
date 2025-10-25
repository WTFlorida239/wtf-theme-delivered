# Automation & Self-Healing Data Sync - Deployment Guide
## WTF | Welcome To Florida - Phase 4

**Last Updated:** October 25, 2025  
**Status:** Ready for Deployment  
**Reminder Set:** November 8, 2025 (2 weeks)

---

## Overview

This guide provides complete instructions for deploying the Phase 4 automation system, which maintains metafield and metaobject integrity through webhooks, reconciliation jobs, and trust reports.

The automation system provides:

- **Real-time product classification** via webhooks
- **Nightly data reconciliation** to detect and fix drift
- **Weekly trust reports** for monitoring health
- **Bar menu cache** for fast page rendering
- **Self-healing** capabilities with idempotent operations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Shopify Store                           │
│  (Products, Metafields, Metaobjects, Collections)              │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Webhooks (HTTPS POST)
                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Webhook Handler Service                      │
│  (Cloudflare Workers / AWS Lambda / Your Server)               │
│                                                                 │
│  • Verify HMAC signatures                                      │
│  • Classify products with heuristics                           │
│  • Update metafields via GraphQL                               │
│  • Maintain idempotency                                        │
└─────────────────────────────────────────────────────────────────┘
                │
                │ GraphQL Mutations
                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Reconciliation Jobs (Cron)                     │
│  (Server / GitHub Actions / Scheduled Task)                     │
│                                                                 │
│  • 2:00 AM: Metafield Consistency Scan                         │
│  • 2:30 AM: Menu Integrity Scan                                │
│  • Monday 9:00 AM: Trust Report Generation                     │
└─────────────────────────────────────────────────────────────────┘
                │
                │ Data Files
                ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Data Storage                              │
│                                                                 │
│  /data/architecture/                                           │
│    • active_ingredient_map.json                                │
│    • bar_menu_item_map.json                                    │
│                                                                 │
│  /data/runtime/                                                │
│    • bar_menu_cache.json                                       │
│                                                                 │
│  /data/reports/                                                │
│    • phase4_trust_report_YYYYMMDD.md                          │
│                                                                 │
│  /data/logs/                                                   │
│    • metafield_consistency_scan_YYYYMMDD.json                 │
│    • menu_integrity_scan_YYYYMMDD.json                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Credentials

1. **Shopify Admin API Access Token**
   - Get from Shopify Admin: Settings → Apps and sales channels → Develop apps → [Your App] → API credentials
   - Scopes required: `write_content`, `read_content`, `write_products`, `read_products`

2. **Shopify Webhook Secret**
   - Generated when creating webhook subscriptions
   - Used to verify HMAC signatures
   - Store securely as environment variable

3. **Shopify API Credentials**
   - API Key: `45e85cd35d398edb95907ef2b0828e72`
   - API Secret: `b6e2d95cfceef4a95c2d897be3d95a9a`

### Infrastructure Options

Choose one deployment platform for webhook handlers:

**Option A: Cloudflare Workers** (Recommended)
- ✅ Free tier: 100,000 requests/day
- ✅ Global edge network (low latency)
- ✅ Built-in KV storage for idempotency
- ✅ Easy deployment via Wrangler CLI

**Option B: AWS Lambda + API Gateway**
- ✅ Generous free tier
- ✅ DynamoDB for idempotency
- ✅ CloudWatch for logging
- ⚠️ More complex setup

**Option C: Your Own Server**
- ✅ Full control
- ✅ Can run reconciliation jobs locally
- ⚠️ Requires public IP and SSL certificate
- ⚠️ Must handle scaling

---

## Deployment Steps

### Step 1: Set Up Webhook Handler

#### Option A: Deploy to Cloudflare Workers

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create Worker Project:**
   ```bash
   cd automation
   wrangler init wtf-webhooks
   cd wtf-webhooks
   ```

3. **Copy Handler Code:**
   ```bash
   cp ../webhook_handler.py handler.py
   ```

4. **Create `wrangler.toml`:**
   ```toml
   name = "wtf-webhooks"
   main = "handler.py"
   compatibility_date = "2024-10-01"

   [vars]
   SHOP_NAME = "accounts-wtfswag"
   API_VERSION = "2024-10"

   [[kv_namespaces]]
   binding = "IDEMPOTENCY"
   id = "your-kv-namespace-id"
   ```

5. **Set Secrets:**
   ```bash
   wrangler secret put SHOPIFY_ACCESS_TOKEN
   # Enter: your-shopify-access-token

   wrangler secret put SHOPIFY_WEBHOOK_SECRET
   # Enter: (will be generated in Step 2)
   ```

6. **Deploy:**
   ```bash
   wrangler deploy
   ```

7. **Note Your Worker URL:**
   ```
   https://wtf-webhooks.your-subdomain.workers.dev
   ```

#### Option B: Deploy to AWS Lambda

1. **Create Lambda Function:**
   - Runtime: Python 3.11
   - Handler: `webhook_handler.lambda_handler`
   - Timeout: 30 seconds
   - Memory: 256 MB

2. **Upload Code:**
   ```bash
   cd automation
   zip -r webhook_handler.zip webhook_handler.py
   aws lambda update-function-code \
     --function-name wtf-webhooks \
     --zip-file fileb://webhook_handler.zip
   ```

3. **Set Environment Variables:**
   ```bash
   aws lambda update-function-configuration \
     --function-name wtf-webhooks \
     --environment Variables="{
       SHOPIFY_ACCESS_TOKEN=your-shopify-access-token,
       SHOP_NAME=accounts-wtfswag,
       API_VERSION=2024-10
     }"
   ```

4. **Create API Gateway:**
   - Create REST API
   - Create POST method for each webhook path
   - Deploy to stage (e.g., `prod`)

5. **Note Your API URL:**
   ```
   https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   ```

#### Option C: Deploy to Your Server

1. **Install Dependencies:**
   ```bash
   pip3 install flask requests
   ```

2. **Create systemd Service:**
   ```ini
   [Unit]
   Description=WTF Webhook Handler
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/wtf-webhooks
   ExecStart=/usr/bin/python3 webhook_handler.py
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Set Up Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 443 ssl;
       server_name webhooks.wtfswag.com;

       ssl_certificate /etc/letsencrypt/live/webhooks.wtfswag.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/webhooks.wtfswag.com/privkey.pem;

       location /webhooks/ {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **Start Service:**
   ```bash
   sudo systemctl enable wtf-webhooks
   sudo systemctl start wtf-webhooks
   ```

5. **Note Your Webhook URL:**
   ```
   https://webhooks.wtfswag.com
   ```

---

### Step 2: Create Webhook Subscriptions

1. **Update Webhook Endpoint URL:**
   
   Edit `automation/create_webhooks.py`:
   ```python
   # Replace with your actual endpoint from Step 1
   WEBHOOK_BASE_URL = "https://wtf-webhooks.your-subdomain.workers.dev/webhooks"
   ```

2. **Run Webhook Creation Script:**
   ```bash
   cd /home/ubuntu/wtf-theme-delivered
   python3 automation/create_webhooks.py
   ```

3. **Verify Webhooks Created:**
   
   Check Shopify Admin:
   - Go to: Settings → Notifications → Webhooks
   - You should see 5 webhooks:
     - `products/create`
     - `products/update`
     - `metaobjects/create`
     - `metaobjects/update`
     - `collections/update`

4. **Save Webhook Secret:**
   
   The webhook secret is displayed in Shopify Admin when you view a webhook.
   Add it to your webhook handler environment variables.

---

### Step 3: Set Up Reconciliation Jobs

#### Option A: Server Cron Jobs

1. **Copy Scripts to Server:**
   ```bash
   scp -r automation/ user@your-server:/var/www/wtf-automation/
   ```

2. **Create Cron Jobs:**
   ```bash
   crontab -e
   ```

   Add:
   ```cron
   # Metafield Consistency Scan - 2:00 AM daily
   0 2 * * * cd /var/www/wtf-automation && python3 reconciliation_jobs.py

   # Trust Report - 9:00 AM every Monday
   0 9 * * 1 cd /var/www/wtf-automation && python3 trust_report_generator.py
   ```

#### Option B: GitHub Actions

1. **Create Workflow File:**
   
   `.github/workflows/reconciliation.yml`:
   ```yaml
   name: Nightly Reconciliation

   on:
     schedule:
       # 2:00 AM EST (7:00 AM UTC)
       - cron: '0 7 * * *'
     workflow_dispatch:

   jobs:
     reconcile:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Set up Python
           uses: actions/setup-python@v4
           with:
             python-version: '3.11'

         - name: Install dependencies
           run: pip install requests

         - name: Run Reconciliation Jobs
           env:
             SHOPIFY_ACCESS_TOKEN: ${{ secrets.SHOPIFY_ACCESS_TOKEN }}
           run: python3 automation/reconciliation_jobs.py

         - name: Commit Data Files
           run: |
             git config user.name "GitHub Actions"
             git config user.email "actions@github.com"
             git add data/
             git commit -m "Update data files from reconciliation" || true
             git push
   ```

2. **Add Repository Secret:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Add secret: `SHOPIFY_ACCESS_TOKEN` = `your-shopify-access-token`

#### Option C: Cloudflare Workers Cron Triggers

1. **Update `wrangler.toml`:**
   ```toml
   [triggers]
   crons = [
     "0 2 * * *",  # 2:00 AM daily
     "0 9 * * 1"   # 9:00 AM Monday
   ]
   ```

2. **Add Cron Handler:**
   ```python
   async def scheduled(event):
       if event.cron == "0 2 * * *":
           # Run reconciliation jobs
           await run_reconciliation()
       elif event.cron == "0 9 * * 1":
           # Generate trust report
           await generate_trust_report()
   ```

---

### Step 4: Test the System

1. **Test Webhook Handler:**
   
   Create a test product in Shopify Admin:
   - Title: "Test Kava Draft Pour"
   - Product Type: "Beverage"
   - Tags: "kava, draft, test"

   Check webhook handler logs to verify:
   - ✅ Webhook received
   - ✅ HMAC verified
   - ✅ Product classified as: layer=bar, ingredient=Kava
   - ✅ `bar_menu_item` metaobject created
   - ✅ `active_ingredient` metafield set to "Kava"

2. **Test Reconciliation Jobs:**
   
   Run manually:
   ```bash
   python3 automation/reconciliation_jobs.py
   ```

   Verify:
   - ✅ All products fetched
   - ✅ Metafield consistency validated
   - ✅ Bar menu integrity checked
   - ✅ Data files updated in `/data/architecture/`
   - ✅ Bar menu cache rebuilt in `/data/runtime/`

3. **Test Trust Report:**
   
   Run manually:
   ```bash
   python3 automation/trust_report_generator.py
   ```

   Verify:
   - ✅ Report generated in `/data/reports/`
   - ✅ Summary statistics accurate
   - ✅ Issues detected and listed
   - ✅ Recommendations provided

---

## Monitoring & Maintenance

### Daily Checks

1. **Review Execution Logs:**
   ```bash
   tail -f /data/logs/metafield_consistency_scan_$(date +%Y%m%d).json
   tail -f /data/logs/menu_integrity_scan_$(date +%Y%m%d).json
   ```

2. **Check Data File Updates:**
   ```bash
   ls -lh /data/architecture/
   ls -lh /data/runtime/
   ```

### Weekly Checks

1. **Review Trust Report:**
   ```bash
   cat /data/reports/phase4_trust_report_$(date +%Y%m%d).md
   ```

2. **Address Issues:**
   - Products missing `active_ingredient`
   - Products with `ingredient = needs_review`
   - Bar products without `bar.menu_reference`
   - Invalid metaobject references

### Monthly Checks

1. **Audit Webhook Deliveries:**
   - Go to: Shopify Admin → Settings → Notifications → Webhooks
   - Check delivery success rates
   - Investigate any failures

2. **Review Heuristic Accuracy:**
   - Sample 10-20 recent products
   - Verify classification correctness
   - Update heuristic patterns if needed

---

## Troubleshooting

### Webhooks Not Firing

**Symptoms:** New products not getting metafields automatically

**Solutions:**
1. Check webhook subscriptions exist in Shopify Admin
2. Verify webhook endpoint is publicly accessible
3. Check HMAC verification is passing
4. Review webhook handler logs for errors

### Reconciliation Jobs Failing

**Symptoms:** Data files not updating, trust reports missing

**Solutions:**
1. Check API credentials are valid
2. Verify GraphQL rate limits not exceeded
3. Review execution logs for specific errors
4. Run jobs manually to debug

### Incorrect Product Classification

**Symptoms:** Products assigned wrong ingredient or layer

**Solutions:**
1. Review heuristic patterns in `webhook_handler.py`
2. Add more specific patterns for edge cases
3. Update product titles/tags/types for clarity
4. Manually fix via Shopify Admin metafield editor

### Data Drift Detected

**Symptoms:** Trust report shows increasing issues over time

**Solutions:**
1. Enable fix mode in reconciliation jobs
2. Review and address "needs_review" products
3. Audit recent product changes for patterns
4. Update heuristic classification rules

---

## Performance & Costs

### Webhook Handler

**Cloudflare Workers (Free Tier):**
- 100,000 requests/day
- Estimated usage: ~500 requests/day (144 products × 3-4 updates/day)
- **Cost:** $0/month

**AWS Lambda (Free Tier):**
- 1M requests/month
- 400,000 GB-seconds compute
- Estimated usage: ~15,000 requests/month
- **Cost:** $0/month (within free tier)

### Reconciliation Jobs

**Server Cron:**
- 2 jobs/day + 1 job/week = ~65 jobs/month
- ~5 minutes compute time per job
- **Cost:** Negligible (uses existing server)

**GitHub Actions:**
- 2,000 minutes/month (free tier)
- ~5 minutes/job × 65 jobs = 325 minutes/month
- **Cost:** $0/month (within free tier)

### Data Storage

**GitHub Repository:**
- ~10 MB total (JSON + logs)
- **Cost:** $0 (included)

**Cloudflare KV:**
- ~1,000 writes/day (idempotency keys)
- ~500 reads/day
- **Cost:** $0/month (within free tier)

---

## Security Best Practices

1. **Always Verify HMAC Signatures**
   - Never process webhooks without verification
   - Use constant-time comparison (`hmac.compare_digest`)

2. **Store Secrets Securely**
   - Use environment variables
   - Never commit secrets to Git
   - Rotate access tokens periodically

3. **Implement Rate Limiting**
   - Respect Shopify GraphQL cost limits
   - Batch mutations when possible
   - Use exponential backoff on errors

4. **Maintain Idempotency**
   - Use (gid, updatedAt) as job key
   - De-duplicate at enqueue time
   - Store processed webhook IDs

5. **Log Everything**
   - Webhook deliveries
   - Classification decisions
   - Mutations applied
   - Errors encountered

---

## Next Steps

1. **Week 1: Deploy Webhook Handlers**
   - [ ] Choose deployment platform
   - [ ] Deploy webhook handler code
   - [ ] Create webhook subscriptions
   - [ ] Test with sample products

2. **Week 2: Set Up Reconciliation**
   - [ ] Deploy reconciliation jobs
   - [ ] Configure cron schedule
   - [ ] Run initial scans
   - [ ] Review first trust report

3. **Week 3: Monitor & Optimize**
   - [ ] Review webhook delivery rates
   - [ ] Audit classification accuracy
   - [ ] Address any issues found
   - [ ] Tune heuristic patterns

4. **Week 4: Expand Automation**
   - [ ] Create Smart Collections by ingredient
   - [ ] Implement bar menu page
   - [ ] Add GTM event tracking
   - [ ] Launch ingredient-based filtering

---

## Support & Resources

**Documentation:**
- `METAFIELD_INTEGRATION_GUIDE.md` - Technical reference
- `PHASE4_FINAL_SUMMARY.md` - Executive summary
- `growth-strategy-report.md` - SEO roadmap

**Code:**
- `automation/webhook_handler.py` - Webhook processing logic
- `automation/reconciliation_jobs.py` - Nightly scans
- `automation/trust_report_generator.py` - Weekly reports

**Data:**
- `/data/architecture/` - Product mappings
- `/data/runtime/` - Bar menu cache
- `/data/reports/` - Trust reports
- `/data/logs/` - Execution logs

**Shopify Resources:**
- [Webhook Documentation](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)
- [GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Metafields Guide](https://shopify.dev/docs/apps/custom-data/metafields)
- [Metaobjects Guide](https://shopify.dev/docs/apps/custom-data/metaobjects)

---

**Deployment Status:** ⏳ Awaiting Hosting Setup  
**Reminder Date:** November 8, 2025  
**Next Review:** Weekly Trust Report (Mondays at 9:00 AM)

---

*This guide was generated as part of Phase 4: Automation & Self-Healing Data Sync*  
*Last updated: October 25, 2025*

