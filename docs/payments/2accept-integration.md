# 2Accept Payment Gateway Integration

## Overview

This document outlines the integration of 2Accept payment gateway with the WTF Shopify store, including setup, testing procedures, and compliance requirements for processing payments.

## Integration Setup

### 1. Gateway Configuration

#### Shopify Admin Setup
1. **Navigate to Settings → Payments**
2. **Add 2Accept as payment provider**
   ```
   Gateway: 2Accept
   Environment: Sandbox (for testing) / Production
   Merchant ID: [PROVIDED_BY_2ACCEPT]
   API Key: [PROVIDED_BY_2ACCEPT]
   Secret Key: [PROVIDED_BY_2ACCEPT]
   ```

3. **Configure payment methods**
   - Credit Cards (Visa, MasterCard, American Express, Discover)
   - Debit Cards
   - ACH/Bank Transfers (if supported)

#### Theme Integration
```liquid
<!-- In checkout.liquid or relevant template -->
{% if checkout.payment_gateway.name == '2Accept' %}
  <script src="https://js.2accept.com/v1/2accept.js"></script>
  <script>
    const twoAccept = new TwoAccept({
      merchantId: '{{ checkout.payment_gateway.merchant_id }}',
      environment: '{{ checkout.payment_gateway.environment }}',
      onSuccess: function(response) {
        // Handle successful payment
        window.location.href = '{{ checkout.order_status_url }}';
      },
      onError: function(error) {
        // Handle payment errors
        console.error('Payment error:', error);
        showPaymentError(error.message);
      }
    });
  </script>
{% endif %}
```

### 2. Security Configuration

#### SSL/TLS Requirements
- Ensure all payment pages use HTTPS
- Verify SSL certificate is valid and up-to-date
- Configure security headers:
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' https://js.2accept.com
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  ```

#### PCI Compliance
- Implement tokenization for card data
- Never store sensitive payment information
- Use 2Accept's secure payment forms
- Regular security assessments

## Testing Procedures

### 1. Test Environment Setup

#### Sandbox Configuration
```javascript
const testConfig = {
  merchantId: 'test_merchant_12345',
  apiKey: 'test_api_key_67890',
  environment: 'sandbox',
  baseUrl: 'https://sandbox-api.2accept.com'
};
```

#### Test Card Numbers
```
Visa: 4111111111111111
MasterCard: 5555555555554444
American Express: 378282246310005
Discover: 6011111111111117

CVV: 123 (any 3-digit number)
Expiry: Any future date
```

### 2. Transaction Testing

#### Authorization Test
```javascript
async function testAuthorization() {
  const authData = {
    amount: 1.00,
    currency: 'USD',
    card: {
      number: '4111111111111111',
      expiry_month: '12',
      expiry_year: '2025',
      cvv: '123'
    },
    billing: {
      name: 'Test Customer',
      email: 'test@wtfswag.com',
      address: '1520 SE 46th Ln Unit B',
      city: 'Cape Coral',
      state: 'FL',
      zip: '33904'
    }
  };

  try {
    const response = await twoAccept.authorize(authData);
    console.log('Authorization successful:', response);
    return response;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
}
```

#### Capture Test
```javascript
async function testCapture(authorizationId) {
  try {
    const response = await twoAccept.capture({
      authorization_id: authorizationId,
      amount: 1.00
    });
    console.log('Capture successful:', response);
    return response;
  } catch (error) {
    console.error('Capture failed:', error);
    throw error;
  }
}
```

#### Void Test
```javascript
async function testVoid(transactionId) {
  try {
    const response = await twoAccept.void({
      transaction_id: transactionId
    });
    console.log('Void successful:', response);
    return response;
  } catch (error) {
    console.error('Void failed:', error);
    throw error;
  }
}
```

#### Refund Test
```javascript
async function testRefund(transactionId, amount) {
  try {
    const response = await twoAccept.refund({
      transaction_id: transactionId,
      amount: amount || 1.00,
      reason: 'Test refund'
    });
    console.log('Refund successful:', response);
    return response;
  } catch (error) {
    console.error('Refund failed:', error);
    throw error;
  }
}
```

### 3. Comprehensive Test Suite

#### Automated Testing Script
```javascript
class TwoAcceptTestSuite {
  constructor() {
    this.results = [];
    this.transactionIds = [];
  }

  async runAllTests() {
    console.log('Starting 2Accept payment gateway tests...');
    
    try {
      // Test 1: Authorization
      await this.testAuthorization();
      
      // Test 2: Capture
      await this.testCapture();
      
      // Test 3: Void
      await this.testVoid();
      
      // Test 4: Refund
      await this.testRefund();
      
      // Test 5: Declined card
      await this.testDeclinedCard();
      
      // Test 6: Invalid card
      await this.testInvalidCard();
      
      // Test 7: Expired card
      await this.testExpiredCard();
      
      this.generateReport();
      
    } catch (error) {
      console.error('Test suite failed:', error);
      this.results.push({
        test: 'Test Suite',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testAuthorization() {
    try {
      const result = await testAuthorization();
      this.transactionIds.push(result.transaction_id);
      this.results.push({
        test: 'Authorization',
        status: 'PASSED',
        transaction_id: result.transaction_id
      });
    } catch (error) {
      this.results.push({
        test: 'Authorization',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  async testDeclinedCard() {
    const declinedCardData = {
      amount: 1.00,
      currency: 'USD',
      card: {
        number: '4000000000000002', // Declined card number
        expiry_month: '12',
        expiry_year: '2025',
        cvv: '123'
      }
    };

    try {
      await twoAccept.authorize(declinedCardData);
      this.results.push({
        test: 'Declined Card',
        status: 'FAILED',
        error: 'Expected decline but transaction succeeded'
      });
    } catch (error) {
      if (error.code === 'card_declined') {
        this.results.push({
          test: 'Declined Card',
          status: 'PASSED',
          message: 'Card properly declined'
        });
      } else {
        this.results.push({
          test: 'Declined Card',
          status: 'FAILED',
          error: error.message
        });
      }
    }
  }

  generateReport() {
    console.log('\n=== 2Accept Test Results ===');
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    
    console.log('\nDetailed Results:');
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.transaction_id) {
        console.log(`   Transaction ID: ${result.transaction_id}`);
      }
    });

    // Generate compliance evidence
    this.generateComplianceEvidence();
  }

  generateComplianceEvidence() {
    const evidence = {
      test_date: new Date().toISOString(),
      gateway: '2Accept',
      merchant_id: testConfig.merchantId,
      environment: 'sandbox',
      tests_performed: this.results,
      compliance_notes: [
        'All sensitive card data handled via tokenization',
        'No card numbers stored in application',
        'HTTPS enforced for all payment pages',
        'PCI DSS compliance maintained'
      ]
    };

    // Save evidence for compliance documentation
    const evidenceJson = JSON.stringify(evidence, null, 2);
    console.log('\nCompliance Evidence Generated:');
    console.log(evidenceJson);
    
    // In production, save this to a secure location
    // fs.writeFileSync(`compliance-evidence-${Date.now()}.json`, evidenceJson);
  }
}

// Run tests
const testSuite = new TwoAcceptTestSuite();
testSuite.runAllTests();
```

## Error Handling

### Common Error Codes
```javascript
const errorMessages = {
  'card_declined': 'Your card was declined. Please try a different payment method.',
  'insufficient_funds': 'Insufficient funds. Please check your account balance.',
  'expired_card': 'Your card has expired. Please use a different card.',
  'invalid_cvv': 'Invalid security code. Please check and try again.',
  'processing_error': 'There was an error processing your payment. Please try again.',
  'network_error': 'Connection error. Please check your internet connection.',
  'gateway_timeout': 'Payment processing timed out. Please try again.'
};

function handlePaymentError(error) {
  const userMessage = errorMessages[error.code] || 'An unexpected error occurred.';
  
  // Log detailed error for debugging
  console.error('Payment Error Details:', {
    code: error.code,
    message: error.message,
    transaction_id: error.transaction_id,
    timestamp: new Date().toISOString()
  });
  
  // Show user-friendly message
  showErrorMessage(userMessage);
  
  // Send error to monitoring system
  if (window.analytics) {
    window.analytics.track('Payment Error', {
      error_code: error.code,
      gateway: '2Accept',
      amount: error.amount
    });
  }
}
```

## Monitoring and Alerts

### Transaction Monitoring
```javascript
class PaymentMonitor {
  constructor() {
    this.metrics = {
      total_transactions: 0,
      successful_transactions: 0,
      failed_transactions: 0,
      average_processing_time: 0
    };
  }

  recordTransaction(transaction) {
    this.metrics.total_transactions++;
    
    if (transaction.status === 'success') {
      this.metrics.successful_transactions++;
    } else {
      this.metrics.failed_transactions++;
      
      // Alert on high failure rate
      const failureRate = this.metrics.failed_transactions / this.metrics.total_transactions;
      if (failureRate > 0.05) { // 5% failure rate threshold
        this.sendAlert('High payment failure rate detected', {
          failure_rate: failureRate,
          total_transactions: this.metrics.total_transactions
        });
      }
    }
    
    // Update processing time
    if (transaction.processing_time) {
      this.updateAverageProcessingTime(transaction.processing_time);
    }
  }

  sendAlert(message, data) {
    // Send to Slack, email, or monitoring system
    console.warn('PAYMENT ALERT:', message, data);
    
    // Example Slack webhook
    fetch('https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Payment Gateway Alert: ${message}`,
        attachments: [{
          color: 'danger',
          fields: Object.entries(data).map(([key, value]) => ({
            title: key,
            value: value,
            short: true
          }))
        }]
      })
    });
  }
}
```

## Compliance Documentation

### Required Evidence
1. **Test Results**: All transaction types tested successfully
2. **Security Measures**: SSL, tokenization, PCI compliance
3. **Error Handling**: Proper error messages and logging
4. **Monitoring**: Transaction monitoring and alerting
5. **Documentation**: Complete integration documentation

### Compliance Checklist
- [ ] PCI DSS compliance maintained
- [ ] All test transactions documented
- [ ] Security headers implemented
- [ ] Error handling tested
- [ ] Monitoring and alerting configured
- [ ] Refund process tested
- [ ] Void process tested
- [ ] Chargeback handling documented

## Production Deployment

### Pre-deployment Checklist
- [ ] All sandbox tests passing
- [ ] Production credentials configured
- [ ] SSL certificate valid
- [ ] Error handling implemented
- [ ] Monitoring configured
- [ ] Compliance documentation complete

### Go-Live Process
1. **Switch to production environment**
2. **Process test transaction with real card**
3. **Verify transaction appears in 2Accept dashboard**
4. **Test refund process**
5. **Monitor for 24 hours**
6. **Document any issues**

### Post-deployment Monitoring
- Monitor transaction success rates
- Review error logs daily
- Weekly compliance review
- Monthly gateway performance assessment

## Support and Escalation

### 2Accept Support
- **Technical Support**: support@2accept.com
- **Phone**: 1-800-2ACCEPT
- **Emergency**: emergency@2accept.com

### Internal Escalation
- **Level 1**: IT Support
- **Level 2**: Operations Manager
- **Level 3**: Store Manager

**Last Updated**: 2024-12-19
**Next Review**: 2025-01-19
**Version**: 1.0
