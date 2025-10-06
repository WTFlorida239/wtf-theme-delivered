# Deployment Guide - WTF Swag Theme

## Current Status

**Date**: October 6, 2025  
**Critical Fix**: Footer error resolved in code, pending deployment  
**Blocker**: Shopify Admin API authentication failing

## What's Been Fixed

### ✅ Footer Error (Code Complete)
- **Issue**: `Liquid error (layout/theme line 261): Could not find asset snippets/footer.liquid`
- **Root Cause**: Footer existed as `sections/footer.liquid` but was being called as a snippet
- **Solution**: Created `snippets/footer.liquid` with proper footer content
- **Files Changed**:
  - Created: `snippets/footer.liquid`
  - Modified: `layout/theme.liquid` (line 261)
- **Status**: ✅ Committed to GitHub main branch
- **Deployment**: ⏳ Pending (needs manual deployment or API fix)

## Deployment Options

### Option 1: Manual Upload via Shopify Admin (RECOMMENDED - FASTEST)

This is the quickest way to get the footer fix live right now.

**Steps**:

1. **Download the footer snippet**:
   - Go to: https://github.com/WTFlorida239/wtf-theme-delivered/blob/main/snippets/footer.liquid
   - Click "Raw" button
   - Save the file as `footer.liquid`

2. **Upload to Shopify**:
   - Log in to Shopify Admin
   - Go to **Online Store** → **Themes**
   - Click **Actions** → **Edit code** on your live theme
   - In the left sidebar, find **Snippets** folder
   - Click **Add a new snippet**
   - Name it: `footer`
   - Paste the content from the downloaded file
   - Click **Save**

3. **Verify the fix**:
   - Visit https://wtfswag.com
   - Scroll to the bottom
   - Footer should now display without errors
   - You should see: Contact info, Hours, Social links

**Time**: 2-3 minutes  
**Risk**: Very low - only adding a missing file

### Option 2: Fix GitHub Integration

If your theme is connected to GitHub for auto-deployment:

**Check Connection**:
1. Go to Shopify Admin → **Online Store** → **Themes**
2. Look for your live theme
3. Check if it shows "Connected to GitHub"
4. If connected, changes should auto-deploy within 5-15 minutes

**Trigger Manual Sync** (if available):
1. In theme settings, look for "Sync from GitHub" or similar button
2. Click to force a sync
3. Wait 2-3 minutes and check the site

### Option 3: Fix Shopify Admin API Access

To enable CLI and API deployment for future updates:

**Problem**: Admin API token authentication failing  
**Error**: `[API] Invalid API key or access token`

**Solution Steps**:

1. **Go to Shopify Admin**:
   - Settings → Apps and sales channels → Develop apps

2. **Find your app** (wtf-store or similar):
   - Click on the app name

3. **Check Installation Status**:
   - Look for "Install app" button
   - If present, click it to install
   - This will generate new API credentials

4. **Get New Admin API Token**:
   - Go to **API credentials** tab
   - Click **Reveal token once** under "Admin API access token"
   - Copy the full token (starts with `shpat_`)
   - Store it securely

5. **Verify Scopes** (Configuration tab):
   - ✅ read_themes
   - ✅ write_themes
   - ✅ read_products
   - ✅ read_customers
   - ✅ write_customers
   - ✅ read_orders

6. **Test the Token**:
   ```bash
   curl -X GET \
     "https://wtfswag.myshopify.com/admin/api/2024-10/shop.json" \
     -H "X-Shopify-Access-Token: YOUR_NEW_TOKEN"
   ```

7. **Once Working**:
   - Provide new token to continue with automated deployments
   - Can use Shopify CLI for instant theme updates

### Option 4: Theme Kit (Alternative CLI)

If Shopify CLI continues to have issues:

1. **Install Theme Kit**:
   ```bash
   brew install themekit  # Mac
   # or download from: https://shopify.github.io/themekit/
   ```

2. **Configure**:
   ```bash
   theme configure --password=YOUR_TOKEN --store=wtfswag.myshopify.com --themeid=THEME_ID
   ```

3. **Deploy**:
   ```bash
   theme deploy layout/theme.liquid snippets/footer.liquid
   ```

## What Happens After Footer Fix

Once the footer is deployed, the site will be error-free and we can proceed with:

### Phase 4: Testing & Validation

1. **Test Ordering System**:
   - Click "Add to Cart" on Quick Order items
   - Verify cart updates correctly
   - Test cart drawer functionality
   - Proceed to checkout

2. **Test Product Pages**:
   - Navigate to each category (Kratom Teas, Kava Drinks, THC Drinks, etc.)
   - Verify products display correctly
   - Check product images and descriptions
   - Test variant selection (if applicable)

3. **Test Checkout Flow**:
   - Add items to cart
   - Go to checkout
   - Verify payment methods configured
   - Test shipping/pickup options
   - Complete a test order

4. **Test Customer Accounts**:
   - Try to create an account
   - Test login functionality
   - Verify account dashboard works
   - Check order history (if test orders exist)

### Phase 5: Additional Improvements

1. **Visual Enhancements**:
   - Optimize product images
   - Remove backgrounds where needed
   - Ensure consistent styling
   - Mobile responsiveness check

2. **SEO Verification**:
   - Check meta tags on all pages
   - Verify blog content preserved
   - Test sitemap functionality
   - Confirm structured data

3. **Performance**:
   - Test page load speeds
   - Optimize asset loading
   - Check for broken links
   - Verify all scripts working

## Files Ready for Deployment

All changes are committed to the `main` branch on GitHub:

### Commit: `07a08bd` - Footer Fix
- **Added**: `snippets/footer.liquid` (160 lines)
- **Modified**: `layout/theme.liquid` (1 line changed)
- **Added**: `docs/STATUS.md` (documentation)
- **Added**: `docs/site-analysis.md` (documentation)

### GitHub Repository
- **URL**: https://github.com/WTFlorida239/wtf-theme-delivered
- **Branch**: main
- **Latest Commit**: Fix footer snippet to resolve section error

## Quick Start: Get Site Live Now

**Fastest Path** (5 minutes):

1. ✅ **Manual Upload Footer** (Option 1 above) - 2 minutes
2. ✅ **Test Site** - Visit wtfswag.com, verify no errors - 1 minute
3. ✅ **Test Quick Order** - Add item to cart, verify it works - 2 minutes

**If ordering works**: Site is ready to accept orders! 🎉

**If ordering doesn't work**: We'll troubleshoot in Phase 4.

## Support & Next Steps

Once the footer is deployed:

1. **Confirm deployment** - Let me know when footer is live
2. **Test ordering** - Try adding items to cart
3. **Report results** - Share what works and what doesn't
4. **Continue fixes** - I'll address any remaining issues

## Contact

All code changes are documented in:
- GitHub: https://github.com/WTFlorida239/wtf-theme-delivered
- This repo: `/home/ubuntu/wtf-theme-delivered`
- Documentation: `/docs/` folder

---

**Bottom Line**: The footer fix is ready. Manual upload (Option 1) will get you live in 2 minutes. Then we can test ordering and complete the site!
