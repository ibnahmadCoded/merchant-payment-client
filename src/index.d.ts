/**
 * Type definitions for merchant-payment-client
 */

declare class MerchantPaymentClient {
    /**
     * Initialize the payment gateway
     * @param merchantId - The merchant identifier
     * @param publicKey - The merchant's public key
     * @param gatewayUrl - The payment gateway URL
     */
    constructor(merchantId: string, publicKey: string, gatewayUrl: string);
  
    /**
     * The merchant identifier
     */
    merchantId: string;
  
    /**
     * The merchant's public key
     */
    publicKey: string;
  
    /**
     * Whether the client has been initialized
     */
    initialized: boolean;
  
    /**
     * Map of pending payments
     */
    pendingPayments: Map<string, {
      agentId: string;
      secret: string;
      status: string;
    }>;
  
    /**
     * Base URL for the payment gateway
     */
    baseUrl: string;
  
    /**
     * EventSource instance for SSE connection
     */
    eventSource: EventSource | null;
  
    /**
     * Initialize the payment gateway
     * Adds necessary markers to the website and establishes SSE connection
     */
    init(): void;
  
    /**
     * Handle a payment request from an AI agent
     * @param agentId - The ID of the requesting agent
     * @param agentPublicKey - The agent's public key in PEM format
     * @param agentPaymentReference - Reference ID for the payment
     * @param paymentAdvice - Payment details
     * @returns Payment initialization result
     */
    handlePaymentRequest(
      agentId: string, 
      agentPublicKey: string, 
      agentPaymentReference: string, 
      paymentAdvice: PaymentAdvice
    ): Promise<PaymentInitResult>;
  
    /**
     * Verify payment status
     * @param paymentId - Payment ID to verify
     * @returns Payment verification result
     */
    verifyPayment(paymentId: string): Promise<PaymentVerificationResult>;
  
    /**
     * Get the status of a payment
     * @param paymentId - The payment ID to check
     * @returns The payment status
     */
    getPaymentStatus(paymentId: string): Promise<string>;
  
    /**
     * Register a callback for payment events
     * @param callback - Function to call when payment events occur
     */
    onPaymentEvent(callback: (event: PaymentEvent) => void): void;
  
    /**
     * Clean up resources
     */
    destroy(): void;
  
    /**
     * Initialize the Server-Sent Events connection
     * @private
     */
    private _initializeEventSource(): void;
  
    /**
     * Encrypt payment advice with the agent's public key
     * @param paymentAdvice - Payment details
     * @param agentPublicKey - Agent's public key in PEM format
     * @returns Base64-encoded encrypted advice
     * @private
     */
    private _encryptPaymentAdvice(paymentAdvice: PaymentAdvice, agentPublicKey: string): Promise<string>;
  
    /**
     * Convert PEM format public key to ArrayBuffer
     * @param pem - PEM formatted public key
     * @returns ArrayBuffer representation
     * @private
     */
    private _pemToArrayBuffer(pem: string): ArrayBuffer;
  
    /**
     * Validate payment advice data
     * @param paymentAdvice - The payment advice to validate
     * @returns True if valid
     * @throws Error if validation fails
     * @private
     */
    private _validatePaymentAdvice(paymentAdvice: PaymentAdvice): boolean;
  }
  
  /**
   * Payment advice interface
   */
  interface PaymentAdvice {
    /**
     * Payment amount
     */
    amount: number;
  
    /**
     * Payment currency (3-letter code)
     */
    currency: string;
  
    /**
     * Payment description (optional)
     */
    description?: string;
  
    /**
     * Additional metadata (optional)
     */
    metadata?: Record<string, any>;
  
    /**
     * Any other properties
     */
    [key: string]: any;
  }
  
  /**
   * Payment initialization result
   */
  interface PaymentInitResult {
    /**
     * Payment ID
     */
    payment_id: string;
  
    /**
     * Encrypted payment advice
     */
    encrypted_advice: string;
  
    /**
     * Secret key for payment verification
     */
    secret: string;
  }
  
  /**
   * Payment verification result
   */
  interface PaymentVerificationResult {
    /**
     * Payment ID
     */
    payment_id: string;
  
    /**
     * Payment status
     */
    status: string;
  
    /**
     * Additional payment details
     */
    [key: string]: any;
  }
  
  /**
   * Payment event details
   */
  interface PaymentEvent {
    /**
     * Payment ID
     */
    payment_id: string;
  
    /**
     * Payment status
     */
    status: string;
  
    /**
     * Error reason (if status is 'failed')
     */
    reason?: string;
  
    /**
     * Additional event details
     */
    [key: string]: any;
  }
  
  export = MerchantPaymentClient;
  