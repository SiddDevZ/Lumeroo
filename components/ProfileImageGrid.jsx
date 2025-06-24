"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { FiTrash2 } from "react-icons/fi";
import config from "@/config.json";

const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return count.toString();
  }
};

const calculateLikePercentage = (likeCount = 0, dislikeCount = 0) => {
  if (likeCount === 0 && dislikeCount === 0) return 0;
  return Math.round((likeCount / (likeCount + dislikeCount)) * 100);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProfileImageCard = ({ image, isOwnProfile, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const likePercentage = calculateLikePercentage(
    image.likeCount || 0,
    image.dislikeCount || 0
  );

  const thumbnailUrl = image.imageUrls && image.imageUrls.length > 0 
    ? image.imageUrls[image.thumbnailIndex || 0] 
    : null;

  const handleDelete = async () => {
    if (!isOwnProfile) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.url}/api/delete/image/${image._id || image.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image deleted successfully');
        onDelete && onDelete(image._id || image.id);
      } else {
        toast.error(data.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!thumbnailUrl) {
    return null;
  }

  return (
    <>
      <Link href={`/watch?v=${image.slug || image._id}`} className="group relative cursor-pointer">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#101010]">
          <Image
            src={config.stream + thumbnailUrl}
            alt={image.title || ""}
            width={400}
            height={400}
            className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300 ease-in-out"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-[#00000059] opacity-95"></div>

          {isOwnProfile && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10 transform hover:scale-110"
              title="Delete image"
            >
              <FiTrash2 size={14} />
            </button>
          )}

          {image.imageUrls && image.imageUrls.length > 1 && (
            <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
              </svg>
              {image.imageUrls.length}
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="font-medium text-white text-sm font-pop leading-normal hover:text-[#d6d203] transition-colors duration-200 line-clamp-2">
            {image.title}
          </h3>

          <div className="flex items-center mt-1 text-[#b1b1b1] text-[0.65rem] whitespace-nowrap sm:text-[0.75rem]">
            <span>{formatDate(image.uploadDate || image.createdAt)}</span>
            <span className="mx-1">•</span>
            <span>{formatCount(image.views || 0)} views</span>
            <span className="mx-1">•</span>
            <span className="text-[#d6d203c6]">{likePercentage}%</span>
          </div>
        </div>
      </Link>

      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}
        >
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-sm w-full border border-[#333] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center">
                <FiTrash2 className="text-red-400" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Image</h3>
            </div>
            
            <p className="text-white/70 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">"{image.title}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-all duration-200 font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ProfileImageGrid = ({ images, isOwnProfile, onImageDelete }) => {
  const handleImageDelete = (deletedImageId) => {
    onImageDelete && onImageDelete(deletedImageId);
  };

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-white/50">No images found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <ProfileImageCard 
            key={image._id || image.id} 
            image={image} 
            isOwnProfile={isOwnProfile}
            onDelete={handleImageDelete}
          />
        ))}
      </div>
    </>
  );
};

export default ProfileImageGrid;