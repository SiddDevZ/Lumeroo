"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch user avatar with their color
 * @param {Object} user - The user object containing avatarColor
 * @returns {Object} - Contains the avatar URL and loading state
 */

export default function useUserAvatar(user) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    if (!user || !user.avatarColor) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const avatarUrl = `/api/userAvatar?color=${encodeURIComponent(user.avatarColor)}`;
      setAvatarUrl(avatarUrl);
    } catch (err) {
      console.error('Error generating user avatar URL:', err);
      setError(err.message);
      setAvatarUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.avatarColor]);

  return { avatarUrl, isLoading, error };
}