

import React, { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import './ProfileImageSection.css';
import {
  handleUploadProfileImageApi,
  handleRemoveProfileImageApi,
  getImageUrl,
} from '../Services/uploadImageService';

function ProfileImageSection({ id, currentImage, onImageChange }) {
  const [imageUrl, setImageUrl] = useState(getImageUrl(currentImage));

  useEffect(() => {
    setImageUrl(getImageUrl(currentImage));
  }, [currentImage]);

  const handleUpload = async (file) => {
    const result = await handleUploadProfileImageApi(id, file);
    const newUrl = getImageUrl(result.profileImage);
    setImageUrl(newUrl);
    if (onImageChange) onImageChange(result.profileImage);
    return result;
  };

  const handleRemove = async () => {
    await handleRemoveProfileImageApi(id);
    setImageUrl(null);
    if (onImageChange) onImageChange(null);
  };

  return (
    <div className="profile-image-section">
      <ImageUpload
        currentImage={imageUrl}
        onUpload={handleUpload}
        onRemove={handleRemove}
        placeholder="?"
        shape="circle"
        size={140}
        label=""
      />
    </div>
  );
}

export default ProfileImageSection;
