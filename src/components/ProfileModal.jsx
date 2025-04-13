import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadImageToCloudinary, getPlaceholderImage } from '../utils/cloudinaryUpload';
import toast, { Toaster } from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, userId, onProfileUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profile, setProfile] = useState({
    firstname: '',
    lastname: '',
    email: '',
    profilePhoto: '',
    profileBio: '',
    linkedin: '',
    telegram: '',
    discord: '',
    youtube: '',
    lineId: '',
    uplandMeIGN: '',
    sandboxUsername: '',
    decentralandUsername: '',
    isProfileComplete: false
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Define required fields
  const requiredFields = ['firstname', 'lastname', 'profileBio', 'profilePhoto'];
  const allFields = [...requiredFields, 'linkedin', 'telegram', 'discord', 'youtube', 'lineId', 'uplandMeIGN', 'sandboxUsername', 'decentralandUsername'];
  
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    // Calculate profile completion percentage
    const requiredFieldsCount = requiredFields.length;
    const allFieldsCount = allFields.length;
    
    let requiredCompleted = 0;
    let optionalCompleted = 0;
    
    requiredFields.forEach(field => {
      if (profile[field]?.trim?.() || (field === 'profilePhoto' && profile[field])) requiredCompleted++;
    });
    
    allFields.forEach(field => {
      if (!requiredFields.includes(field) && profile[field]?.trim?.()) optionalCompleted++;
    });
    
    // Weight required fields more heavily (70% of score)
    const requiredWeight = 70;
    const optionalWeight = 30;
    
    const requiredPercentage = (requiredCompleted / requiredFieldsCount) * requiredWeight;
    const optionalPercentage = (optionalCompleted / (allFieldsCount - requiredFieldsCount)) * optionalWeight;
    
    const percentage = Math.round(requiredPercentage + optionalPercentage);
    setCompletionPercentage(percentage);
    
    // Update isProfileComplete based on required fields
    const isComplete = requiredCompleted === requiredFieldsCount;
    setProfile(prev => ({
      ...prev,
      isProfileComplete: isComplete
    }));
  }, [profile.firstname, profile.lastname, profile.profileBio, profile.profilePhoto, 
      profile.linkedin, profile.telegram, profile.discord, profile.youtube, 
      profile.lineId, profile.uplandMeIGN, profile.sandboxUsername, profile.decentralandUsername]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          ...profile,
          ...userData,
          email: auth.currentUser?.email || ''
        });
      } else {
        // If no profile exists yet, just set the email and create a new user document
        const newUserData = {
          uid: userId,
          email: auth.currentUser?.email || '',
          isProfileComplete: false,
          createdAt: serverTimestamp()
        };
        
        await setDoc(userDocRef, newUserData);
        setProfile({
          ...profile,
          ...newUserData
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        setUploadError('Please select an image file');
        return;
      }
      
      setPhotoFile(file);
      setUploadError(null);
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const areRequiredFieldsComplete = () => {
    return requiredFields.every(field => {
      if (field === 'profilePhoto') {
        return profile[field] || photoFile;
      }
      return profile[field]?.trim?.();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      let photoURL = profile.profilePhoto;
      
      // Upload photo if a new one was selected
      if (photoFile) {
        try {
          // Simulate upload progress (Cloudinary direct upload doesn't provide progress events)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const next = prev + 10;
              return next > 90 ? 90 : next; // Cap at 90% until complete
            });
          }, 300);
          
          // Upload to Cloudinary
          photoURL = await uploadImageToCloudinary(photoFile, userId);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
        } catch (uploadError) {
          clearInterval(progressInterval);
          setUploadProgress(0);
          
          // Use a fallback placeholder with user's initials if upload fails
          photoURL = getPlaceholderImage(profile.firstname, profile.lastname);
          setUploadError('Failed to upload image to Cloudinary. Using placeholder instead.');
          toast.error('Image upload failed. Using placeholder instead.');
        }
      }
      
      // Check if all required fields are complete
      const photoComplete = photoURL ? true : false;
      const otherFieldsComplete = requiredFields
        .filter(field => field !== 'profilePhoto')
        .every(field => profile[field]?.trim?.());
      
      const isComplete = otherFieldsComplete && photoComplete;
      
      // Organize links into a nested object
      const links = {
        linkedin: profile.linkedin || '',
        telegram: profile.telegram || '',
        discord: profile.discord || '',
        youtube: profile.youtube || '',
        lineId: profile.lineId || '',
        uplandMeIGN: profile.uplandMeIGN || '',
        sandboxUsername: profile.sandboxUsername || '',
        decentralandUsername: profile.decentralandUsername || ''
      };
      
      // Update profile in Firestore
      const userDocRef = doc(db, 'users', userId);
      const userData = {
        uid: userId,
        email: profile.email,
        firstname: profile.firstname,
        lastname: profile.lastname,
        profilePhoto: photoURL,
        bio: profile.profileBio,
        links,
        isProfileComplete: isComplete,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, userData, { merge: true });
      
      // Update local state with the new photo URL and completion status
      setProfile(prev => ({
        ...prev,
        profilePhoto: photoURL,
        isProfileComplete: isComplete
      }));
      
      // Notify parent component about profile update
      if (onProfileUpdate) {
        onProfileUpdate({
          ...userData,
          profilePhoto: photoURL,
          isProfileComplete: isComplete
        });
      }
      
      toast.success('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000); // Close after 1 second to let user see the success toast
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const getFieldClass = (fieldName) => {
    const isRequired = requiredFields.includes(fieldName);
    const isEmpty = fieldName === 'profilePhoto' 
      ? !profile[fieldName] && !photoPreview
      : !profile[fieldName]?.trim?.();
    
    if (isRequired && isEmpty) {
      return "border-amber-300 bg-white";
    }
    return "border-gray-200";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '8px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
        },
      }} />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={modalVariants}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Your Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Completion Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-medium text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {!profile.isProfileComplete && (
            <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
              <p className="text-sm text-blue-700 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-light">Complete your profile to unlock article creation. Required fields are marked with <span className="text-blue-500 font-medium">*</span></span>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-28 h-28 rounded-full overflow-hidden border-2 ${getFieldClass('profilePhoto').includes('amber') ? 'border-amber-300 ring-4 ring-amber-100' : 'border-gray-200'}`}>
                {(photoPreview || profile.profilePhoto) ? (
                  <img 
                    src={photoPreview || profile.profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                
                {/* Upload progress overlay */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-xs font-medium">
                      {uploadProgress}%
                    </div>
                  </div>
                )}
              </div>
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoChange}
              />
            </div>
          </div>
          
          {/* Upload error message */}
          {uploadError && (
            <p className="text-center text-sm text-amber-500">{uploadError}</p>
          )}
          
          {/* Required field warning */}
          {!profile.profilePhoto && !photoPreview && (
            <p className="text-center text-sm text-amber-500">Profile photo is required <span className="text-blue-500">*</span></p>
          )}
          
          {/* Image upload guidelines */}
          <div className="text-center text-xs text-gray-400">
            <p>Upload a square image, max 5MB (JPG, PNG or GIF)</p>
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700 pb-2 border-b border-gray-100">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={profile.firstname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border ${getFieldClass('firstname')} rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="First Name"
                  autoFocus={!profile.firstname}
                  required
                />
                {requiredFields.includes('firstname') && !profile.firstname?.trim() && (
                  <p className="mt-1 text-xs text-amber-500">This field is required</p>
                )}
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={profile.lastname}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border ${getFieldClass('lastname')} rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="Last Name"
                  required
                />
                {requiredFields.includes('lastname') && !profile.lastname?.trim() && (
                  <p className="mt-1 text-xs text-amber-500">This field is required</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="profileBio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio <span className="text-blue-500">*</span>
                </label>
                <textarea
                  id="profileBio"
                  name="profileBio"
                  value={profile.profileBio}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${getFieldClass('profileBio')} rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="Tell readers about yourself..."
                  rows={4}
                  required
                />
                {requiredFields.includes('profileBio') && !profile.profileBio?.trim() && (
                  <p className="mt-1 text-xs text-amber-500">This field is required</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  Write a short bio that will appear with your articles
                </p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700 pb-2 border-b border-gray-100">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                <input
                  type="text"
                  id="telegram"
                  name="telegram"
                  value={profile.telegram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="@username"
                />
              </div>
              <div>
                <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-1">Discord</label>
                <input
                  type="text"
                  id="discord"
                  name="discord"
                  value={profile.discord}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="username#0000"
                />
              </div>
              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                <input
                  type="url"
                  id="youtube"
                  name="youtube"
                  value={profile.youtube}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://youtube.com/c/username"
                />
              </div>
            </div>
          </div>

          {/* Metaverse Handles */}
          <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700 pb-2 border-b border-gray-100">Metaverse Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="lineId" className="block text-sm font-medium text-gray-700 mb-1">Line ID</label>
                <input
                  type="text"
                  id="lineId"
                  name="lineId"
                  value={profile.lineId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Line ID"
                />
              </div>
              <div>
                <label htmlFor="uplandMeIGN" className="block text-sm font-medium text-gray-700 mb-1">Upland.me IGN</label>
                <input
                  type="text"
                  id="uplandMeIGN"
                  name="uplandMeIGN"
                  value={profile.uplandMeIGN}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Upland.me IGN"
                />
              </div>
              <div>
                <label htmlFor="sandboxUsername" className="block text-sm font-medium text-gray-700 mb-1">Sandbox Username</label>
                <input
                  type="text"
                  id="sandboxUsername"
                  name="sandboxUsername"
                  value={profile.sandboxUsername}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Sandbox Username"
                />
              </div>
              <div>
                <label htmlFor="decentralandUsername" className="block text-sm font-medium text-gray-700 mb-1">Decentraland Username</label>
                <input
                  type="text"
                  id="decentralandUsername"
                  name="decentralandUsername"
                  value={profile.decentralandUsername}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your Decentraland Username"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center shadow-lg shadow-blue-500/20"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileModal; 