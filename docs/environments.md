# Environment Configuration

## Overview

This document tracks the environment configurations for the WTF Swag Shopify store.

## Environments

### Production
- **Store Domain**: `wtfswag.myshopify.com`
- **Primary Domain**: `wtfswag.com`
- **Customer Accounts Domain**: `account.wtfswag.com`
- **Additional Domains**:
  - `accounts-wtfswag.myshopify.com`
  - `www.wtfswag.com`
  - `3ca86d-e4.myshopify.com`
- **API Version**: 2025-07
- **Status**: Active

### Development
- **Store Domain**: TBD
- **Status**: Not configured

### Staging
- **Store Domain**: TBD
- **Status**: Not configured

## API Configuration

### Admin API
- **Version**: 2025-07
- **Webhook Version**: 2025-07
- **Access**: Configured with full permissions

### Storefront API
- **Version**: 2025-07
- **Access Token**: Configured

## Notes

- All credentials are stored securely in Manus vault
- Tokens should be rotated if any API call fails with authentication errors
- Current setup uses production store for all development work
