# Merchant Payment Client

A JavaScript SDK for websites to accept payments from AI agents.

## Installation

```bash
npm install merchant-payment-client
```

## Quick Start

### 1. Install the SDK

```bash
npm install merchant-payment-client
```

### 2. Import and initialize

```javascript
// Import the SDK
import MerchantPaymentClient from 'merchant-payment-client';

// For vanilla JS/HTML environments
// const MerchantPaymentClient = require('merchant-payment-client');
// or
// <script src="node_modules/merchant-payment-client/src/index.js"></script>

// Initialize the gateway with your merchant credentials
const paymentGateway = new MerchantPaymentClient(
  'YOUR_MERCHANT_ID',
  'YOUR_PUBLIC_KEY',
  'https://payment-gateway.example.com'
);

// Initialize the payment system
paymentGateway.init();
```

### 3. Set up payment event handling

The SDK supports two methods for handling payment events:

#### Option A: Using built-in event listeners

```javascript
// Set up event handlers to respond to payment events
paymentGateway.onPaymentEvent((event) => {
  console.log('Payment event:', event);
  
  // Update UI based on payment status
  if (event.status === 'completed') {
    showPaymentSuccessMessage(event.payment_id);
  } else if (event.status === 'failed') {
    showPaymentFailureMessage(event.reason);
  } else if (event.status === 'initialized') {
    showPaymentInitializedMessage(event.payment_id);
  }
});
```

#### Option B: Using API verification

For server-side verification of payments (recommended for more sensitive applications):

```javascript
const handleVerifyPayment = async (paymentId) => {
  try {
    const response = await fetch(`https://payment-gateway.example.com/api/payments/verify/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_SECRET_KEY', // Replace with actual API key handling
      },
    });
    
    if (!response.ok) {
      throw new Error('Payment not found or invalid request');
    }
    
    const data = await response.json();
    
    // Handle payment verification result
    if (data.status === 'completed') {
      showPaymentSuccessMessage(data.payment_id);
    } else {
      showPaymentPendingMessage(data.status);
    }
    
    return data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    showPaymentErrorMessage(error.message);
    return null;
  }
};

// Example usage
document.getElementById('verify-button').addEventListener('click', (e) => {
  e.preventDefault();
  handleVerifyPayment('PAYMENT_ID_HERE');
});
```

### 4. Set up webhook for payment notifications (optional)

For receiving notifications about payment status changes, you can set up a webhook endpoint:

#### For Next.js applications:

```javascript
// File: app/api/webhook/payment/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const notification = await request.json();
    
    // Log the payment notification
    console.log('Received payment notification:', notification);
    
    // Handle different payment statuses
    if (notification.status === 'completed') {
      console.log(`Payment ${notification.payment_id} completed with secret: ${notification.secret}`);
      // Handle payment completion
    } else if (notification.status === 'initialized') {
      console.log(`Payment ${notification.payment_id} initialized`);
      // Handle payment initialization
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### For Express.js applications:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/webhook/payment', (req, res) => {
  const notification = req.body;
  
  // Log the payment notification
  console.log('Received payment notification:', notification);
  
  // Handle different payment statuses
  if (notification.status === 'completed') {
    console.log(`Payment ${notification.payment_id} completed with secret: ${notification.secret}`);
    // Handle payment completion
  } else if (notification.status === 'initialized') {
    console.log(`Payment ${notification.payment_id} initialized`);
    // Handle payment initialization
  }
  
  res.json({ received: true });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

**Note**: Your webhook URL must be registered with the payment processing backend.

## How It Works

1. The SDK adds a special meta tag to your website that AI agents can detect
2. When an AI agent wants to make a payment, it communicates with your site
3. The SDK handles the secure communication and payment processing
4. You receive real-time updates about payment status

## API Reference

### Constructor

```javascript
const gateway = new MerchantPaymentClient(merchantId, publicKey, gatewayUrl);
```

- `merchantId`: Your unique merchant identifier
- `publicKey`: Your public key for authentication with the payment gateway
- `gatewayUrl`: The URL of the payment gateway service

### Methods

#### `init()`

Initializes the payment gateway by adding the necessary markers to your website and establishing a connection to the payment gateway.

#### `handlePaymentRequest(agentId, agentPublicKey, agentPaymentReference, paymentAdvice)`

Processes a payment request from an AI agent.

- `agentId`: The ID of the requesting agent
- `agentPublicKey`: The public key of the agent in PEM format
- `agentPaymentReference`: A reference ID for tracking the payment
- `paymentAdvice`: An object containing payment details (amount, currency, etc.)

Returns a Promise that resolves to a payment initialization result.

#### `verifyPayment(paymentId)`

Verifies the status of a payment.

- `paymentId`: The ID of the payment to verify

Returns a Promise that resolves to the payment verification result.

#### `getPaymentStatus(paymentId)`

Gets the current status of a payment.

- `paymentId`: The ID of the payment to check

Returns a Promise that resolves to the payment status.

#### `onPaymentEvent(callback)`

Registers a callback function to be called when payment events occur.

- `callback`: A function that will receive payment event details

#### `destroy()`

Cleans up resources used by the payment gateway.

## Integrating with Your Website

### Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Store</title>
  <script src="node_modules/merchant-payment-client/src/index.js"></script>
</head>
<body>
  <div id="payment-status"></div>
  
  <script>
    // Initialize payment gateway
    const gateway = new MerchantPaymentClient(
      'YOUR_MERCHANT_ID',
      'YOUR_PUBLIC_KEY',
      'https://payment-gateway.example.com'
    );
    
    gateway.init();
    
    // Handle payment events
    gateway.onPaymentEvent((event) => {
      document.getElementById('payment-status').textContent = `Payment ${event.status}`;
    });
  </script>
</body>
</html>
```

### React Integration

```jsx
import React, { useEffect } from 'react';
import MerchantPaymentClient from 'merchant-payment-client';

function PaymentComponent() {
  useEffect(() => {
    // Initialize payment gateway
    const gateway = new MerchantPaymentClient(
      'YOUR_MERCHANT_ID',
      'YOUR_PUBLIC_KEY',
      'https://payment-gateway.example.com'
    );
    
    gateway.init();
    
    // Handle payment events
    const handlePaymentEvent = (event) => {
      console.log('Payment event:', event);
    };
    
    gateway.onPaymentEvent(handlePaymentEvent);
    
    // Cleanup on unmount
    return () => {
      gateway.destroy();
    };
  }, []);
  
  return (
    <div>
      <h2>AI Payment Enabled Website</h2>
      <p>This website accepts payments from AI agents.</p>
    </div>
  );
}

export default PaymentComponent;
```

## Security
This SDK uses RSA public-key cryptography for secure communication with the payment gateway service and the agent. Ensure that your private key is kept secure and never exposed in client-side code.

## Testing and General Usage

Due to the workload, there are currently no published tests for this SDK. However, you can learn how to set up and use this SDK alongside the other 2 components ([payment gateway backend](https://github.com/ibnahmadcoded/agent-payment-client) and [merchant frontend SDK](https://github.com/ibnahmadcoded/merchant-payment-client)) in this [repository](https://github.com/ibnahmadcoded/agent-pay-demo).

## Waitlist

Be among the first to use our infrastructure when we release our full backend app. Join the [waitlist](https://tally.so/r/wvKeg4). 

## Community

Join our community on [Discord](https://discord.gg/6C3uwQb8) and follow us on LinkedIn and X. Feel free to contribute and raise issues. 

## Security Considerations and Advice

- Keep your private keys secure and never expose them in client-side code
- Always validate payment amounts and details on your server
- Set up proper error handling for payment failures

## License

MIT
