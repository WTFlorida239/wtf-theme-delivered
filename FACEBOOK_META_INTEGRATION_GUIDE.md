# Facebook/Meta Ads Integration Guide

## Overview

This guide explains how to configure Facebook/Meta Ads integration for the WTF | Welcome To Florida Shopify store. The integration includes:

1. **Open Graph Social Optimization** - Enhanced metadata for social sharing and discovery
2. **Facebook SDK** - Social graph integration for audio-triggered ads
3. **Meta Pixel** - Client-side event tracking
4. **Conversions API** - Server-side event tracking for improved attribution

## What's Been Implemented

### 1. Enhanced Open Graph Tags

**Location:** `snippets/seo-head.liquid`

The following metadata has been added to improve social discovery:

- **Facebook App ID** (`fb:app_id`) - Links your site to your Facebook app
- **Domain Verification** (`facebook-domain-verification`) - Verifies domain ownership
- **Social Links** (`og:see_also`) - Cross-references to your social profiles
- **Business Location Data** - Latitude/longitude and address for location-based targeting
- **Enhanced Product Metadata** - Price, availability, and brand information

### 2. Facebook SDK Integration

**Location:** `layout/theme.liquid` (body tag)

The Facebook JavaScript SDK has been integrated to enable:

- Social plugins (Like, Share, Comments)
- Facebook Login integration (if needed)
- Advanced audience targeting
- Social graph signals for audio-triggered ads

### 3. Meta Pixel Enhancement

**Location:** `assets/wtf-analytics.js`

Your existing Meta Pixel implementation has been enhanced with:

- Advanced matching (hashed email for better attribution)
- Automatic PageView tracking
- E-commerce event tracking (AddToCart, Purchase, ViewContent)
- Event deduplication with Conversions API

### 4. Meta Conversions API

**Location:** `snippets/meta-conversions-api.liquid`

Server-side event tracking that:

- Complements the Meta Pixel
- Overcomes browser tracking limitations (iOS 14+, ad blockers)
- Improves attribution accuracy
- Sends events with unique IDs to prevent duplication

## Setup Instructions

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in app details:
   - **App Name:** WTF | Welcome To Florida
   - **Contact Email:** Your business email
5. Once created, note your **App ID** (you'll need this)

### Step 2: Configure Facebook Business Manager

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to **Business Settings** → **Brand Safety** → **Domains**
3. Click **"Add"** and enter: `wtfswag.com`
4. Choose **"Meta-tag Verification"**
5. Copy the verification code (format: `xxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 3: Set Up Meta Pixel (if not already done)

1. In Business Manager, go to **Events Manager**
2. Click **"Connect Data Sources"** → **"Web"** → **"Meta Pixel"**
3. If you already have a Pixel, note the **Pixel ID**
4. If creating new, follow the setup wizard and note the **Pixel ID**

### Step 4: Configure Shopify Theme Settings

1. Log in to your Shopify admin
2. Go to **Online Store** → **Themes** → **Customize**
3. Click **Theme Settings** → **Analytics & Pixels**
4. Fill in the following fields:

   - **Meta Pixel ID:** Your Facebook Pixel ID (e.g., `123456789012345`)
   - **Facebook App ID:** Your Facebook App ID from Step 1
   - **Facebook Domain Verification Code:** The code from Step 2

5. Click **Save**

### Step 5: Set Up Conversions API (Server-Side)

The Conversions API requires a server-side endpoint to send events to Facebook. You have two options:

#### Option A: Use Shopify App (Recommended)

1. Install the official **"Facebook & Instagram"** app from Shopify App Store
2. Connect your Facebook Business Manager account
3. The app will automatically handle server-side events

#### Option B: Custom Implementation

If you want full control, you'll need to:

1. Create a server-side endpoint at `/apps/wtf/meta-capi`
2. Get your **Conversions API Access Token** from Facebook Events Manager
3. Implement event forwarding to Facebook's Graph API

**Example endpoint implementation:**

```javascript
// This would be in your middleware/server code
app.post('/apps/wtf/meta-capi', async (req, res) => {
  const eventData = req.body;
  
  // Hash PII data (email, phone)
  if (eventData.user_data.em) {
    eventData.user_data.em = await sha256(eventData.user_data.em);
  }
  
  // Send to Facebook
  await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [eventData],
      access_token: CONVERSIONS_API_TOKEN
    })
  });
  
  res.status(200).send('OK');
});
```

### Step 6: Verify Installation

1. Install the **Facebook Pixel Helper** Chrome extension
2. Visit your store at `wtfswag.com`
3. Click the extension icon - you should see:
   - PageView event firing
   - Your Pixel ID
   - Advanced Matching status

4. In Facebook Events Manager:
   - Go to **Test Events**
   - Browse your site and verify events appear in real-time

### Step 7: Set Up Social Media Metafields (Optional)

To enable the `og:see_also` tags for better social discovery:

1. In Shopify admin, go to **Settings** → **Metafields**
2. Add shop metafields:
   - Namespace: `social`
   - Key: `facebook`
   - Value: Your Facebook page URL (e.g., `https://facebook.com/wtfswag`)
   
   - Namespace: `social`
   - Key: `instagram`
   - Value: Your Instagram URL (e.g., `https://instagram.com/wtfswag`)

## Audio-Triggered Ads & Social Discovery

### How It Works

When someone mentions "WTF" or related keywords in conversations on Facebook:

1. **Facebook's Audio Recognition** (if enabled by user) picks up the keyword
2. **Social Graph Signals** from your enhanced Open Graph tags help Facebook understand your brand
3. **Location Data** from your business metadata helps target local users
4. **Facebook SDK** provides additional context about user interactions
5. **Your ads** can be shown as "suggested content" or in News Feed

### Best Practices

1. **Create Facebook Ads** targeting keywords:
   - "WTF"
   - "Welcome To Florida"
   - "Kava bar Cape Coral"
   - "Kratom tea Florida"

2. **Use Dynamic Ads** to show products people viewed on your site

3. **Enable Facebook Shops** to make products discoverable directly on Facebook

4. **Post Regularly** on your Facebook page to increase social signals

5. **Encourage Check-ins** at your physical location (1520 SE 46th Ln, Cape Coral)

## Tracking Events

The following events are automatically tracked:

| Event | Trigger | Pixel | CAPI |
|-------|---------|-------|------|
| **PageView** | Every page load | ✓ | ✓ |
| **ViewContent** | Product page view | ✓ | ✓ |
| **AddToCart** | Item added to cart | ✓ | ✓ |
| **InitiateCheckout** | Checkout started | ✓ | ✓ |
| **Purchase** | Order completed | ✓ | ✓ |

## Advanced Features

### Custom Audiences

With this integration, you can create Facebook Custom Audiences based on:

- **Website Visitors** - Anyone who visited your site
- **Product Viewers** - People who viewed specific products
- **Cart Abandoners** - Users who added items but didn't purchase
- **Past Purchasers** - Customers who completed orders

### Lookalike Audiences

Use your customer data to find similar people:

1. Go to Facebook Ads Manager → **Audiences**
2. Click **Create Audience** → **Lookalike Audience**
3. Choose your source (e.g., "Past Purchasers")
4. Select location (Florida, or broader)
5. Choose audience size (1-10%, start with 1% for best match)

### Dynamic Product Ads

Show personalized ads featuring products people viewed:

1. Ensure your product catalog is synced to Facebook
2. Create a Dynamic Ad campaign
3. Facebook will automatically show relevant products to each user

## Troubleshooting

### Pixel Not Firing

- Check that **Meta Pixel ID** is entered in theme settings
- Verify no ad blockers are interfering
- Check browser console for JavaScript errors

### Events Not Showing in Events Manager

- Ensure Pixel ID is correct
- Check that events are firing in Pixel Helper
- Wait up to 20 minutes for events to appear in dashboard

### Conversions API Not Working

- Verify server endpoint is receiving requests
- Check that Access Token is valid and has correct permissions
- Ensure PII data is being hashed before sending

### Domain Verification Failed

- Ensure verification code is entered exactly as provided
- Check that theme changes have been published
- Allow up to 72 hours for verification to complete

## Privacy & Compliance

### GDPR/CCPA Compliance

The integration respects Shopify's Customer Privacy API:

```javascript
// Checks consent before tracking
function hasConsent() {
  const api = window.Shopify?.customerPrivacy;
  if (api) {
    const prefs = api.userConsentPreferences();
    return !!(prefs?.marketing || prefs?.analytics);
  }
  return true; // Default to true if API not available
}
```

### Data Collection

The following data is collected:

- **Hashed email** (SHA-256) for advanced matching
- **IP address** (server-side only)
- **User agent** (browser information)
- **Facebook browser ID** (_fbp cookie)
- **Facebook click ID** (_fbc cookie)
- **Event data** (page views, products viewed, purchases)

All PII is hashed before transmission to Facebook.

## Support & Resources

- [Facebook Business Help Center](https://www.facebook.com/business/help)
- [Meta Pixel Documentation](https://developers.facebook.com/docs/meta-pixel)
- [Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Facebook Ads Manager](https://www.facebook.com/adsmanager)
- [Events Manager](https://business.facebook.com/events_manager2)

## Next Steps

1. **Complete the setup steps above**
2. **Create your first Facebook ad campaign**
3. **Set up Custom Audiences** based on website visitors
4. **Create Lookalike Audiences** to expand reach
5. **Monitor performance** in Facebook Ads Manager
6. **Test different ad creatives** mentioning "WTF" and local keywords

---

**Questions?** Contact your development team or refer to the Facebook Business Help Center.
