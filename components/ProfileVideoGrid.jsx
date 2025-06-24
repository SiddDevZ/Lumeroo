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

const formatDuration = (seconds) => {
  if (seconds === -1) return "Processing...";
  if (!seconds || seconds === 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
};

const ProfileVideoCard = ({ video, isOwnProfile, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const likePercentage = calculateLikePercentage(video.likeCount, video.dislikeCount);
  const isProcessing = video.isProcessing || false;

  const handleDelete = async () => {
    if (!isOwnProfile) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.url}/api/delete/video/${video._id || video.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Video deleted successfully');
        onDelete && onDelete(video._id || video.id);
      } else {
        toast.error(data.message || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete video');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleProcessingClick = (e) => {
    e.preventDefault();
    toast.info(
      "Video is still processing. Refreshing page to check for updates...",
      {
        duration: 2000,
      }
    );

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const VideoCard = ({ children, className, ...props }) => {
    if (isProcessing) {
      return (
        <div className={className} onClick={handleProcessingClick} {...props}>
          {children}
        </div>
      );
    }

    return (
      <Link href={`/watch?v=${video.slug}`} className={className} {...props}>
        {children}
      </Link>
    );
  };

  return (
    <>
      <VideoCard className="group relative cursor-pointer">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-[#101010]">
          {isProcessing ? (
            <div className="w-full h-full bg-[#1a1a1a] animate-pulse flex items-center justify-center">
              <div className="text-white/80 font-roboto text-sm font-medium">Processing...</div>
            </div>
          ) : (
            <Image
              src={config.stream + video.thumbnail || ""}
              alt={video.title || ""}
              width={640}
              height={360}
              className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-300 ease-in-out"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-[#00000059] opacity-95"></div>

          {isOwnProfile && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10 transform hover:scale-110"
              title="Delete video"
            >
              <FiTrash2 size={14} />
            </button>
          )}

          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="mt-2">
          <h3 className="font-medium text-white text-sm font-pop leading-normal hover:text-[#d6d203] transition-colors duration-200 line-clamp-2">
            {video.title}
          </h3>

          <div className="flex items-center mt-1 text-[#b1b1b1] text-xs">
            <span>{formatDate(video.createdAt)}</span>
            <span className="mx-1.5">•</span>
            <span>{formatCount(video.views)} views</span>
            <span className="mx-1.5">•</span>
            <span className="text-[#d6d203d3]">{likePercentage}%</span>
          </div>
        </div>
      </VideoCard>

      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}
        >
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-sm w-full border border-[#333] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className=" flex items-center justify-center">
                <FiTrash2 className="text-red-400" size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Video</h3>
            </div>
            
            <p className="text-white/70 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-medium">"{video.title}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 cursor-pointer bg-[#333] hover:bg-[#444] text-white rounded-lg transition-all duration-200 font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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

const ProfileVideoGrid = ({ videos, isOwnProfile, onVideoDelete }) => {
  const handleVideoDelete = (deletedVideoId) => {
    onVideoDelete && onVideoDelete(deletedVideoId);
  };

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-white/50">No videos found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <ProfileVideoCard 
            key={video.id || video._id} 
            video={video} 
            isOwnProfile={isOwnProfile}
            onDelete={handleVideoDelete}
          />
        ))}
      </div>
    </>
  );
};

export default ProfileVideoGrid;
