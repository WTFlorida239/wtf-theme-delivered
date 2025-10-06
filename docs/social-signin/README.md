# Social Sign-In Implementation Guide

## Overview

This document outlines the process for enabling Google and Facebook native sign-in for customer accounts on the WTF Swag Shopify store. Social sign-in provides customers with a streamlined authentication experience, reducing friction during account creation and login.

## Prerequisites

### Customer Accounts Mode

Social sign-in with Google and Facebook is **only available with New Customer Accounts**. The store must be migrated from Classic to New customer accounts before social sign-in can be enabled.

**Current Status**: Pending API verification to determine current customer accounts mode.

### Required Information from Google

To enable Google sign-in, you'll need to set up a Google Cloud project and OAuth consent screen:

1. **Google Cloud Project**: Create or use existing project at https://console.cloud.google.com
2. **OAuth 2.0 Client ID**: Create credentials for a Web application
3. **OAuth Consent Screen**: Configure with your app name and branding
4. **Authorized Redirect URIs**: Add Shopify's callback URLs (provided during setup)
5. **Authorized Domains**: Add your store domains (wtfswag.com, account.wtfswag.com)

**Information Needed from You**:
- Google OAuth Client ID
- Google OAuth Client Secret
- OAuth consent screen configuration (app name, logo, privacy policy URL)

### Required Information from Facebook/Meta

To enable Facebook sign-in, you'll need to create a Facebook App:

1. **Facebook App**: Create at https://developers.facebook.com
2. **App ID and App Secret**: Generated when you create the app
3. **Facebook Login Product**: Add to your app
4. **Valid OAuth Redirect URIs**: Add Shopify's callback URLs
5. **App Review**: May need to submit for review depending on permissions

**Information Needed from You**:
- Facebook App ID
- Facebook App Secret
- App configuration (name, icon, privacy policy URL)

## Migration from Classic to New Customer Accounts

### Understanding the Difference

**Classic Customer Accounts**:
- Liquid-based templates hosted on your store domain
- Email/password authentication only
- Form-based login flow
- Templates in `templates/customers/` directory
- Full theme control over UI

**New Customer Accounts**:
- Modern authentication system with OAuth support
- Hosted on dedicated customer accounts domain (account.wtfswag.com)
- Supports social sign-in (Google, Facebook, Apple)
- Enhanced security with passwordless options
- Shopify-managed UI with limited customization
- Better integration with checkout authentication

### Migration Steps

If the store is currently on Classic customer accounts, here's the migration plan:

#### Step 1: Backup Current Setup
- Export customer data (handled automatically by Shopify)
- Document current theme customizations
- Test current login flow and capture screenshots

#### Step 2: Enable New Customer Accounts
1. Go to Shopify Admin → Settings → Customer accounts
2. Select "New customer accounts" option
3. Choose account requirement level:
   - **Optional**: Customers can checkout as guests or create accounts
   - **Required**: Customers must create account to checkout (not recommended)
4. Save changes

#### Step 3: Configure Customer Accounts Domain
- Primary domain: account.wtfswag.com (already connected based on domains screenshot)
- Verify domain is properly configured and SSL is active
- Test login redirect from main site

#### Step 4: Update Theme (if needed)
- Account links in header remain functional (use `{{ routes.account_login_url }}`)
- Classic templates serve as fallback for some features
- Test all account-related links and flows

#### Step 5: Verify Migration
- Test customer login with existing accounts
- Verify order history is accessible
- Check address management functionality
- Confirm email notifications are working

### Rollback Plan

If issues arise, you can switch back to Classic customer accounts:

1. Go to Settings → Customer accounts
2. Select "Classic customer accounts"
3. Save changes
4. All customer data and accounts remain intact
5. Theme reverts to using Classic templates

**Note**: Rollback is simple and non-destructive. Customer data is never lost during migration.

## Enabling Social Sign-In (New Customer Accounts Only)

Once the store is on New customer accounts, social sign-in can be enabled through Shopify Admin.

### Step 1: Configure Google Sign-In

1. In Shopify Admin, go to **Settings → Customer accounts**
2. Scroll to **Social sign-in** section
3. Click **Add provider** → Select **Google**
4. Enter your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Copy the redirect URI provided by Shopify
6. Add the redirect URI to your Google Cloud Console OAuth settings
7. Save and enable Google sign-in

### Step 2: Configure Facebook Sign-In

1. In the same **Social sign-in** section
2. Click **Add provider** → Select **Facebook**
3. Enter your Facebook App credentials:
   - App ID
   - App Secret
4. Copy the redirect URI provided by Shopify
5. Add the redirect URI to your Facebook App settings
6. Save and enable Facebook sign-in

### Step 3: Test Social Sign-In

1. Open an incognito/private browser window
2. Navigate to wtfswag.com and click "Sign in"
3. Verify you're redirected to New customer accounts login page
4. Confirm Google and Facebook buttons are visible
5. Test login with both providers
6. Verify account creation and profile data sync

## Where Social Sign-In Buttons Appear

### Customer Login Page

When New customer accounts are enabled with social sign-in:

- **URL**: Redirects to account.wtfswag.com/account/login
- **Button Location**: Above or below the email/password form
- **Button Style**: Native Shopify-styled buttons with provider logos
- **Button Text**: "Continue with Google" / "Continue with Facebook"

### Customer Registration Flow

- Social buttons appear on both login and registration pages
- First-time social login automatically creates a customer account
- Customer profile populated with data from social provider (name, email)
- No password required for social sign-in accounts

### Theme Integration

The theme's existing account links work seamlessly:

```liquid
<!-- In sections/header.liquid -->
{% if customer %}
  <a href="{{ routes.account_url }}">My Account</a>
  <a href="{{ routes.account_logout_url }}">Log out</a>
{% else %}
  <a href="{{ routes.account_login_url }}">Sign in</a>
  <a href="{{ routes.account_register_url }}">Create account</a>
{% endif %}
```

**Key Points**:
- No theme code changes required for social buttons
- Buttons are automatically displayed by Shopify
- Theme links redirect to New customer accounts pages
- Classic templates remain as fallback for some features

## Security and Privacy Considerations

### Data Handling

When customers sign in with Google or Facebook:

- **Email address**: Synced to Shopify customer record
- **Name**: Synced to customer first/last name fields
- **Profile photo**: Not synced to Shopify
- **Other data**: Not accessed or stored

### Privacy Policy Requirements

Your privacy policy should disclose:

- Use of third-party authentication providers
- What data is collected from social providers
- How customer data is used and stored
- Link to Shopify's privacy practices

### GDPR and Compliance

- Social sign-in is GDPR compliant when properly configured
- Customers can disconnect social accounts from their profile
- Customer data deletion requests apply to all authentication methods
- Ensure your Google and Facebook apps have proper privacy policies

## Troubleshooting

### Social Buttons Not Appearing

**Possible Causes**:
- Store still on Classic customer accounts (migration required)
- Social provider not enabled in Shopify Admin
- OAuth credentials incorrect or expired
- Redirect URIs not properly configured

**Solution**: Verify New customer accounts are enabled and social providers are configured with correct credentials.

### Authentication Errors

**Possible Causes**:
- OAuth client secret incorrect
- Redirect URI mismatch
- Facebook app not in production mode
- Google OAuth consent screen not published

**Solution**: Double-check all credentials and ensure redirect URIs match exactly (including https:// and trailing slashes).

### Customers Can't Access Existing Accounts

**Possible Causes**:
- Email address mismatch between social provider and Shopify account
- Customer has multiple accounts with different emails

**Solution**: Customers can link social accounts to existing accounts by logging in with email/password first, then connecting social provider in account settings.

## Next Steps After Social Sign-In is Enabled

1. **Update marketing materials**: Promote easy social sign-in to customers
2. **Monitor adoption**: Track percentage of customers using social login
3. **Customer support**: Train team on social sign-in troubleshooting
4. **Email notifications**: Ensure welcome emails work for social sign-in customers
5. **Analytics**: Monitor conversion rates for social vs. traditional login

## Additional Resources

- [Shopify Customer Accounts Documentation](https://help.shopify.com/en/manual/customers/customer-accounts)
- [Google OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Shopify Admin API - Customer Accounts](https://shopify.dev/docs/api/admin-graphql/latest/objects/CustomerAccountsV2)

## Status Summary

**Current State**: 
- ✅ Repository cloned and workspace set up
- ✅ Documentation structure created
- ✅ Theme inventory completed
- ⏳ Customer accounts mode verification pending (API rate limit)
- ⏳ Social sign-in prerequisites documented

**Next Actions** (Prompt 2):
1. Verify customer accounts mode via Shopify Admin
2. If Classic, execute migration to New customer accounts
3. Obtain Google OAuth credentials from user
4. Obtain Facebook App credentials from user
5. Enable social sign-in providers in Shopify Admin
6. Test social sign-in functionality
7. Update theme header/navigation if needed for optimal UX
