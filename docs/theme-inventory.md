# Theme Inventory - Customer Account Templates

## Overview

This document inventories all customer account-related templates, sections, and snippets in the WTF Swag theme.

## Customer Account Templates

The theme includes the following customer account templates located in `templates/customers/`:

### Authentication Templates

**templates/customers/login.liquid**
- Purpose: Customer sign-in page
- Features: Email/password form, forgot password link, create account link
- Form: Uses Shopify's `customer_login` form
- Entry Point: Accessible via `/account/login` or `{{ routes.account_login_url }}`

**templates/customers/register.liquid**
- Purpose: New customer registration
- Features: Account creation form with email and password
- Form: Uses Shopify's `customer_register` form
- Entry Point: Accessible via `/account/register` or `{{ routes.account_register_url }}`

**templates/customers/activate_account.liquid**
- Purpose: Account activation after registration
- Features: Password setup for new accounts
- Form: Uses Shopify's `activate_customer_password` form
- Entry Point: Sent via email link to new customers

**templates/customers/reset_password.liquid**
- Purpose: Password reset form
- Features: New password entry after reset request
- Form: Uses Shopify's `reset_customer_password` form
- Entry Point: Sent via email link for password recovery

### Account Management Templates

**templates/customers/account.liquid**
- Purpose: Customer account dashboard
- Features: Order history, account details, default address
- Entry Point: Accessible via `/account` or `{{ routes.account_url }}`

**templates/customers/addresses.liquid**
- Purpose: Address book management
- Features: Add, edit, delete customer addresses, set default address
- Forms: Uses `customer_address` form for CRUD operations
- Entry Point: Accessible from account dashboard

**templates/customers/order.liquid**
- Purpose: Individual order details page
- Features: Order line items, shipping info, order status
- Entry Point: Linked from account dashboard order history

## Theme Header/Navigation

### Account Entry Points

The theme's header navigation should include links to customer account pages. Common locations:

**sections/header.liquid**
- Should contain account/login links in navigation
- Typical pattern: Show "Account" link when logged in, "Sign in" when logged out
- Liquid logic: `{% if customer %}` to check authentication state

### Expected Account Links in Header

```liquid
{% if customer %}
  <a href="{{ routes.account_url }}">My Account</a>
  <a href="{{ routes.account_logout_url }}">Log out</a>
{% else %}
  <a href="{{ routes.account_login_url }}">Sign in</a>
  <a href="{{ routes.account_register_url }}">Create account</a>
{% endif %}
```

## Customer Account Mode Detection

The theme currently uses **Classic Customer Accounts** based on the presence of standard Liquid templates. Classic accounts use:

- Liquid-based templates in `templates/customers/`
- Form-based authentication with email/password
- Shopify-hosted account pages on the store domain

## Social Sign-In Integration Points

For **New Customer Accounts** with social sign-in (Google/Facebook), the integration points would be:

### Login Page
- Native social sign-in buttons appear automatically on New customer accounts login page
- No theme modification required for button display
- Buttons are managed through Shopify Admin settings

### Header Navigation
- Account links remain the same
- Login URL redirects to New customer accounts page when enabled
- Theme should use `{{ routes.account_login_url }}` for forward compatibility

### Migration Considerations

If migrating from Classic to New customer accounts:

1. **Templates remain functional** - Classic templates serve as fallback
2. **Login redirects** - Users redirected to New customer accounts login
3. **Social buttons** - Appear automatically after enabling in Admin
4. **Theme updates** - May need to update header links for optimal UX

## Notes

- All customer templates use Shopify's standard form helpers
- Forms include built-in error handling via `form.errors`
- Templates are minimal and functional, ready for styling enhancements
- No custom JavaScript for account functionality detected
- Theme follows Shopify's standard customer account patterns
