const twilio = require('twilio');

// Initialize Twilio client only if credentials are provided
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Send OTP via SMS using Twilio
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - Success status
 */
const sendOTP = async (phoneNumber, otp) => {
  try {
    // Check if Twilio is configured
    if (!client) {
      console.log(`OTP for ${phoneNumber}: ${otp} (Twilio not configured - development mode)`);
      return true; // Return true for development mode
    }

    // Format phone number (ensure it starts with +)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      // Assume Indian number if no country code
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+91' + formattedPhone.substring(1);
      } else if (formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      } else {
        formattedPhone = '+' + formattedPhone;
      }
    }

    const message = `Your Aayuniq Health Portal OTP is: ${otp}. This OTP is valid for 10 minutes. Do not share it with anyone.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`OTP sent successfully to ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify OTP (basic implementation - in production, use proper OTP service)
 * @param {string} phoneNumber - Phone number
 * @param {string} otp - OTP to verify
 * @returns {Promise<boolean>} - Verification status
 */
const verifyOTP = async (phoneNumber, otp) => {
  // This is a placeholder implementation
  // In a real application, you would verify against the stored OTP
  // or use a proper OTP verification service
  return true;
};

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Alternative OTP service using Fast2SMS (if Twilio is not available)
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPViaFast2SMS = async (phoneNumber, otp) => {
  try {
    const axios = require('axios');
    
    // Format phone number for Indian numbers
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const message = `Your Aayuniq Health Portal OTP is: ${otp}. Valid for 10 minutes.`;
    
    const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route: 'otp',
      variables_values: otp,
      numbers: formattedPhone
    }, {
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.return === true) {
      console.log(`OTP sent successfully via Fast2SMS to ${formattedPhone}`);
      return true;
    } else {
      throw new Error('Fast2SMS API error');
    }
  } catch (error) {
    console.error('Error sending OTP via Fast2SMS:', error);
    throw new Error('Failed to send OTP via Fast2SMS');
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  generateOTP,
  sendOTPViaFast2SMS
};
