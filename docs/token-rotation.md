# Token Rotation Policy

## Current Strategy

The system uses existing Shopify tokens for all API operations. If any Shopify Admin API or Storefront API call fails with authentication errors (401, 403, or invalid token messages), the system will prompt the user for fresh credentials and retry the operation.

## Token Storage

All tokens are stored securely in Manus' secure vault and are never committed to version control or exposed in logs.

## Rotation Triggers

Token rotation should occur when:

1. **Authentication Failures**: Any API call returns 401 Unauthorized or 403 Forbidden
2. **Invalid Token Errors**: API returns "Invalid API key or access token" message
3. **Scheduled Rotation**: At the end of each development session (recommended)
4. **Security Events**: If tokens are suspected to be compromised

## Rotation Process

When token rotation is required:

1. System pauses current operations
2. User is prompted with exact credential requirements
3. User provides new tokens via secure input
4. Tokens are validated with lightweight API call
5. New tokens are stored in secure vault
6. Operations resume with new credentials

## Required Credentials

### Admin API Access Token
- Format: `shpat_*`
- Required Scopes: read_customers, write_customers, read_customer_accounts, read_themes, read_products, read_orders
- Location: Shopify Admin → Settings → Apps and sales channels → Develop apps → [App Name] → API credentials

### Storefront API Access Token
- Format: 32-character hexadecimal string
- Required Scopes: unauthenticated_read_product_listings, unauthenticated_read_customers
- Location: Same as Admin API

### Additional Credentials
- **API Key**: Used for app identification
- **API Secret**: Used for webhook verification and OAuth
- **Shop Domain**: Primary myshopify.com domain

## Security Best Practices

- Never log or print tokens in console output
- Never commit tokens to Git repositories
- Rotate tokens immediately if exposed
- Use minimum required scopes for each token
- Monitor API usage for unusual patterns
