/**
 * WhatsApp Business Solution Provider (BSP) Integration Abstraction
 * 
 * This module handles communication with a WhatsApp BSP (like AiSensy, Interakt, or Twilio).
 * It abstracts away the specific provider API so you can swap providers simply by
 * changing this file, without touching the rest of the application.
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const isDev = process.env.NODE_ENV !== 'production';

export const WHATSAPP_TEMPLATES = {
  WELCOME_MESSAGE: 'welcome_tenant_v1',
  PAYMENT_RECEIPT: 'payment_receipt_v1'
};

/**
 * Sends a WhatsApp template message to a user.
 * 
 * @param {string} to - The recipient's phone number (with country code, e.g., '919876543210')
 * @param {string} templateName - The name of the approved template in the BSP dashboard
 * @param {Array<string>} parameters - An array of parameters to fill into the template
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendWhatsAppMessage(to, templateName, parameters = []) {
  if (isDev && WHATSAPP_API_KEY === 'mock-key') {
    // In development with mock key, simulate a successful API call
    console.log(`[MOCK WhatsApp] Sending '${templateName}' to ${to} with params:`, parameters);
    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`
    };
  }

  try {
    // Example: AiSensy payload structure
    // Adjust this payload structure depending on your chosen BSP (Interakt, Wati, Twilio, etc.)
    const payload = {
      apiKey: WHATSAPP_API_KEY,
      campaignName: templateName,
      destination: to,
      userName: parameters[0] || 'Tenant', // Often required by AiSensy
      templateParams: parameters
    };

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Unknown BSP error');
    }

    return {
      success: true,
      messageId: data.messageId || 'unknown_id' // Depending on BSP response
    };

  } catch (error) {
    console.error('[WhatsApp Service] Error sending message:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
