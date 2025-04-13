/**
 * Utility for uploading images to Cloudinary
 */

// Cloudinary configuration from environment variables
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} userId - User ID to use in the public_id
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImageToCloudinary = async (file, userId) => {
  try {
    console.log('Starting Cloudinary upload to cloud:', CLOUD_NAME);
    console.log('Using upload preset:', UPLOAD_PRESET);
    
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Don't include API key in unsigned uploads - it's not needed
    // formData.append('folder', 'profiles'); // Optional: organize by folder instead of directly in public_id
    
    // Using a timestamp and userId to make the public_id unique
    const timestamp = new Date().getTime();
    formData.append('public_id', `profiles/${userId}_${timestamp}`);
    
    // Make the upload request to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    // Log response status for debugging
    console.log('Cloudinary response status:', response.status);
    
    // Get response as text first for debugging
    const responseText = await response.text();
    console.log('Cloudinary response text:', responseText);
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    // Parse the response text as JSON
    const data = JSON.parse(responseText);
    
    // Return the secure URL of the uploaded image
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Fallback function to use if Cloudinary upload fails - uses a placeholder image
 * @returns {string} - URL of a placeholder image
 */
export const getPlaceholderImage = (firstName = '', lastName = '') => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colors = [
    '3b82f6', // blue-500
    '10b981', // emerald-500 
    'f59e0b', // amber-500
    'ef4444', // red-500
    '8b5cf6', // violet-500
  ];
  
  // Choose a color based on the first character of the user's name
  const colorIndex = (firstName.charCodeAt(0) || 0) % colors.length;
  const color = colors[colorIndex];
  
  // Generate a UI Avatars URL with the user's initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=256&bold=true`;
};

/**
 * Function to generate a data URL from a file (for previews before upload)
 * @param {File} file - The image file
 * @returns {Promise<string>} - Data URL for the image
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Helper function to determine if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  uploadImageToCloudinary,
  getPlaceholderImage,
  fileToDataUrl,
  isValidUrl
}; 