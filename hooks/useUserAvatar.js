"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to generate a user avatar SVG directly
 * @param {Object} user - The user object containing avatarColor and username
 * @returns {Object} - Contains the avatar URL and loading state
 */

export default function useUserAvatar(user) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    if (!user || !user.username) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const avatarColor = user.avatarColor;
      const name = user.username || 'L';

      const color = avatarColor.startsWith('#') ? avatarColor : `#${avatarColor}`;
      const initial = name.charAt(0).toUpperCase();

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="32" fill="${color}" />
          <text x="50%" y="50%" dy=".1em" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#ffffff" font-weight="500">
            ${initial}
          </text>
        </svg>
      `;
      
      const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

      setAvatarUrl(dataUrl);
    } catch (err) {
      console.error('Error generating user avatar URL:', err);
      setError(err.message);
      setAvatarUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.avatarColor, user?.username]);

  return { avatarUrl, isLoading, error };
}