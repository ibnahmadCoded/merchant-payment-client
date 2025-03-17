/**
 * Merchant Payment Client
 * Frontend SDK for websites to accept payments from AI agents
 */
class MerchantPaymentClient {
    /**
     * Initialize the payment gateway
     * @param {string} merchantId - The merchant identifier
     * @param {string} publicKey - The merchant's public key
     * @param {string} gatewayUrl - The payment gateway URL
     */
    constructor(merchantId, publicKey, gatewayUrl) {
        this.merchantId = merchantId;
        this.publicKey = publicKey;
        this.initialized = false;
        this.pendingPayments = new Map();
        this.baseUrl = gatewayUrl;
        this.eventSource = null;
    }

    /**
     * Initialize the payment gateway
     * Adds necessary markers to the website and establishes SSE connection
     */
    init() {
        // Add payment gateway marker
        const marker = document.createElement('meta');
        marker.setAttribute('data-ai-payments', 'enabled');
        marker.setAttribute('data-merchant-id', this.merchantId);
        document.head.appendChild(marker);

        // Initialize SSE connection for payment requests
        this._initializeEventSource();
        this.initialized = true;
    }

    /**
     * Initialize the Server-Sent Events connection
     * @private
     */
    _initializeEventSource() {
        // Use Server-Sent Events to receive payment initation requests
        this.eventSource = new EventSource(
            `${this.baseUrl}/api/payments/events?merchant_id=${this.merchantId}&key=${this.publicKey}`
        );

        this.eventSource.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'payment_request') {
                await this.handlePaymentRequest(
                    data.agentId,
                    data.publicKey,
                    data.agentPaymentReference,
                    data.paymentAdvice
                );
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            // Attempt to reconnect after a delay
            setTimeout(() => this._initializeEventSource(), 5000);
        };
    }

    /**
     * Handle a payment request from an AI agent
     * @param {string} agentId - The ID of the requesting agent
     * @param {string} agentPublicKey - The agent's public key in PEM format
     * @param {string} agentPaymentReference - Reference ID for the payment
     * @param {Object} paymentAdvice - Payment details
     * @returns {Promise<Object>} Payment initialization result
     */
    async handlePaymentRequest(agentId, agentPublicKey, agentPaymentReference, paymentAdvice) {
        if (!this.initialized) {
            throw new Error('Payment gateway not initialized');
        }

        try {
            const encryptedAdvice = await this._encryptPaymentAdvice(
                paymentAdvice,
                agentPublicKey
            );

            const secret = crypto.getRandomValues(new Uint8Array(32));
            const secretHex = Array.from(secret)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            const response = await fetch(`${this.baseUrl}/api/payments/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.publicKey}`,
                },
                body: JSON.stringify({
                    payment_advice: JSON.stringify(paymentAdvice),
                    encrypted_payment_advice: encryptedAdvice,
                    agent_id: agentId,
                    merchant_id: this.merchantId,
                    secret: secretHex,
                    ...(agentPaymentReference ? { agent_payment_reference: String(agentPaymentReference) } : {})
                })
            });

            const paymentData = await response.json();
            
            this.pendingPayments.set(paymentData.payment_id, {
                agentId,
                secret: secretHex,
                status: 'initialized'
            });

            return {
                payment_id: paymentData.payment_id,
                encrypted_advice: encryptedAdvice,
                secret: secretHex
            };
        } catch (error) {
            console.error('Payment initialization failed:', error);
            throw error;
        }
    }

    /**
     * Encrypt payment advice with the agent's public key
     * @param {Object} paymentAdvice - Payment details
     * @param {string} agentPublicKey - Agent's public key in PEM format
     * @returns {Promise<string>} Base64-encoded encrypted advice
     * @private
     */
    async _encryptPaymentAdvice(paymentAdvice, agentPublicKey) {
        const publicKeyData = await window.crypto.subtle.importKey(
            'spki',
            this._pemToArrayBuffer(agentPublicKey),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['encrypt']
        );

        const encoded = new TextEncoder().encode(JSON.stringify(paymentAdvice));
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP'
            },
            publicKeyData,
            encoded
        );

        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }

    /**
     * Convert PEM format public key to ArrayBuffer
     * @param {string} pem - PEM formatted public key
     * @returns {ArrayBuffer} ArrayBuffer representation
     * @private
     */
    _pemToArrayBuffer(pem) {
        const base64 = pem
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .replace(/\s/g, '');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Verify payment status
     * @param {string} paymentId - Payment ID to verify
     * @returns {Promise<Object>} Payment verification result
     */
    async verifyPayment(paymentId) {
        try {
            const response = await fetch(`${this.baseUrl}/verify/${paymentId}`, {
                headers: {
                    'X-API-Key': this.publicKey
                }
            });
            
            const result = await response.json();
            
            if (this.pendingPayments.has(paymentId)) {
                this.pendingPayments.get(paymentId).status = result.status;
            }
            
            return result;
        } catch (error) {
            console.error('Payment verification failed:', error);
            throw error;
        }
    }

    /**
     * Validate payment advice data
     * @param {Object} paymentAdvice - The payment advice to validate
     * @returns {boolean} True if valid
     * @throws {Error} If validation fails
     * @private
     */
    _validatePaymentAdvice(paymentAdvice) {
        const required = ['amount', 'currency'];
        for (const field of required) {
            if (!(field in paymentAdvice)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (typeof paymentAdvice.amount !== 'number' || paymentAdvice.amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (typeof paymentAdvice.currency !== 'string' || paymentAdvice.currency.length !== 3) {
            throw new Error('Invalid currency code');
        }

        return true;
    }

    /**
     * Get the status of a payment
     * @param {string} paymentId - The payment ID to check
     * @returns {Promise<string>} The payment status
     */
    async getPaymentStatus(paymentId) {
        if (this.pendingPayments.has(paymentId)) {
            return this.pendingPayments.get(paymentId).status;
        }
        
        // If not in pending payments, verify with server
        const result = await this.verifyPayment(paymentId);
        return result.status;
    }

    /**
     * Register a callback for payment events
     * @param {Function} callback - Function to call when payment events occur
     */
    onPaymentEvent(callback) {
        window.addEventListener('ai_payment_event', (event) => {
            callback(event.detail);
        });
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.pendingPayments.clear();
        this.initialized = false;
    }
}

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerchantPaymentClient;
} else {
    window.MerchantPaymentClient = MerchantPaymentClient;
}