import { getApiBase } from '../Utils/apiBase';

const getBase = () => getApiBase();

// Upload profile image
// file: File object from input[type="file"]
export const handleUploadProfileImageApi = async (userId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userId', userId);

  const response = await fetch(`${getBase()}/api/upload/profile`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type — browser sets it automatically with boundary for multipart
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }
  return response.json();
};

// Remove profile image
export const handleRemoveProfileImageApi = async (userId) => {
  const response = await fetch(`${getBase()}/api/upload/profile`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove image');
  }
  return response.json();
};

// Upload team image (owner only)
export const handleUploadTeamImageApi = async (userId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('userId', userId);

  const response = await fetch(`${getBase()}/api/upload/team`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }
  return response.json();
};

// Remove team image (owner only)
export const handleRemoveTeamImageApi = async (userId) => {
  const response = await fetch(`${getBase()}/api/upload/team`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to remove image');
  }
  return response.json();
};

// Helper — builds image URL from stored path
// In dev with proxy, use relative path so requests go through proxy (same-origin).
// Otherwise use full backend URL.
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Use relative path in dev so proxy forwards to backend (avoids CORS/cross-origin issues)
  if (imagePath.startsWith('/')) return imagePath;
  return `${getBase()}/${imagePath}`;
};
