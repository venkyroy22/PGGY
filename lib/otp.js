/**
 * OTP Service Abstraction
 * 
 * Mock implementation for development.
 * Swap in MSG91, Twilio, or any OTP provider by replacing
 * the implementations of sendOTP() and verifyOTP().
 */

// In-memory OTP store for development
const otpStore = new Map();

/**
 * Send an OTP to the given phone number
 * 
 * Mock: Generates a random 6-digit OTP, stores it, logs to console.
 * Production: Replace with MSG91/Twilio API call.
 * 
 * @param {string} phone - Phone number (with country code)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendOTP(phone) {
  try {
    // In development, use a fixed OTP for testing
    const otp = process.env.NODE_ENV === 'production'
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '123456';

    // Store OTP with 5-minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // In production, call your OTP provider here:
    // await msg91.sendOTP({ phone, otp });
    // await twilio.sendSMS({ to: phone, body: `Your PGGY OTP is: ${otp}` });

    console.log(`[OTP Service] OTP for ${phone}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('[OTP Service] Failed to send OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    };
  }
}

/**
 * Verify an OTP for the given phone number
 * 
 * Mock: Accepts '123456' in development mode.
 * Production: Replace with MSG91/Twilio verification API call.
 * 
 * @param {string} phone - Phone number (with country code)
 * @param {string} otp - The OTP entered by the user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyOTP(phone, otp) {
  try {
    const stored = otpStore.get(phone);

    if (!stored) {
      return {
        success: false,
        message: 'No OTP found. Please request a new one.',
      };
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    if (stored.otp !== otp) {
      return {
        success: false,
        message: 'Invalid OTP. Please try again.',
      };
    }

    // Clean up used OTP
    otpStore.delete(phone);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('[OTP Service] Failed to verify OTP:', error);
    return {
      success: false,
      message: 'Verification failed. Please try again.',
    };
  }
}
