# ⚡ Quick Integration Checklist - WTF Theme

## 🚀 30-Minute Setup Guide

### 1. Shopify Payment Setup (5 minutes)
```bash
# Navigate to Shopify Admin
# Settings → Payments → Shopify Payments
# Complete business verification
# Add bank account for payouts
```

### 2. Webhook Configuration (10 minutes)
```javascript
// Create required webhooks via Admin API
const webhooks = [
  { topic: 'orders/create', address: 'https://your-pos.com/orders' },
  { topic: 'orders/paid', address: 'https://your-pos.com/payments' },
  { topic: 'inventory_levels/update', address: 'https://your-pos.com/inventory' }
];

// Use provided webhook creation script
node scripts/setup-webhooks.js
```

### 3. Lightspeed Integration (10 minutes)
```bash
# Set environment variables
export LIGHTSPEED_API_KEY="your_api_key"
export LIGHTSPEED_ENDPOINT="your_endpoint"

# Test connection
curl -H "Authorization: Bearer $LIGHTSPEED_API_KEY" $LIGHTSPEED_ENDPOINT/test
```

### 4. Receipt Printer Setup (5 minutes)
```bash
# Verify printer connection
ping your-printer-ip

# Test print job
echo "Test Receipt" | lp -d receipt-printer
```

## ✅ Verification Steps

### Payment Flow Test
1. Add test product to cart with customizations
2. Complete checkout with test payment
3. Verify order appears in Shopify admin
4. Confirm webhook delivery to Lightspeed
5. Check receipt printer output

### Integration Health Check
```bash
# Run automated health check
node scripts/health-check.js

# Expected output:
# ✅ Shopify API: Connected
# ✅ Lightspeed API: Connected  
# ✅ Webhooks: Delivering
# ✅ Receipt Printer: Online
```

## 🔧 Environment Variables Required

```bash
# Shopify Configuration
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SHOPIFY_ACCESS_TOKEN="your_access_token"
SHOPIFY_WEBHOOK_SECRET="your_webhook_secret"

# Lightspeed Configuration
LIGHTSPEED_API_KEY="your_lightspeed_api_key"
LIGHTSPEED_ENDPOINT="https://your-lightspeed-endpoint.com"

# Notification Settings
ADMIN_EMAIL="admin@wtfswag.com"
ADMIN_PHONE="+1234567890"
```

## 📋 Go-Live Checklist

- [ ] Payment gateway tested with $1 authorization
- [ ] Webhooks delivering successfully
- [ ] Lightspeed receiving order data
- [ ] Receipt printer producing output
- [ ] Inventory sync working bidirectionally
- [ ] Error alerts configured
- [ ] Staff trained on new system
- [ ] Backup procedures documented

## 🆘 Emergency Contacts

- **Technical Issues**: Check TECHNICAL_DOCUMENTATION.md
- **Payment Problems**: Shopify Support + Lightspeed Support
- **System Failures**: Run `node scripts/emergency-fallback.js`

## 📞 Support Resources

- **Full Documentation**: PAYMENT_RAILS_INTEGRATION.md
- **Technical Guide**: TECHNICAL_DOCUMENTATION.md
- **Troubleshooting**: See "Common Issues" section in payment rails doc
- **Health Monitoring**: Automated alerts configured for critical failures

---

**Total Setup Time**: ~30 minutes  
**Complexity Level**: Beginner-friendly  
**Support Level**: Comprehensive automation + documentation
