"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { VideoType } from './Types';
import { RiUser3Line } from "react-icons/ri";
import useUserAvatar from "@/hooks/useUserAvatar";
import config from "@/config.json";

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return count.toString();
  }
};

const calculateLikePercentage = (likeCount: number = 0, dislikeCount: number = 0): number => {
  if (likeCount === 0 && dislikeCount === 0) return 0;
  return Math.round((likeCount / (likeCount + dislikeCount)) * 100);
};

const formatDuration = (duration: string | number): string => {
  const seconds = typeof duration === 'string' ? parseFloat(duration) : duration;
  
  if (seconds === -1) return "Processing...";
  if (!seconds || seconds === 0 || isNaN(seconds)) return "0:00";

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

interface VideoCardProps {
  video: VideoType;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const likePercentage = calculateLikePercentage(video.likeCount, video.dislikeCount);
  
  const uploaderObj = typeof video.uploader === 'string' 
    ? { username: video.uploader, avatar: undefined, avatarColor: undefined }
    : video.uploader;
  
  const avatarData = useUserAvatar(uploaderObj) as { avatarUrl: string | null; isLoading: boolean; error: string | null };
  const avatarUrl = avatarData?.avatarUrl;
  
  return (
    <div className="">
      <Link 
        href={`/watch?v=${video.slug || video.id}`}
        className="block group cursor-pointer"
      >
        <div className="relative aspect-video overflow-hidden rounded-lg bg-[#101010]">
          <Image 
            src={config.stream + video.thumbnail || ''} 
            alt={video.title || ''}
            width={640}
            height={360}
            className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300 ease-in-out"
          />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-[#00000059] opacity-95"></div>
          
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>

      <div className="flex mt-3 gap-3">
        <Link 
          href={`/profile?user=${encodeURIComponent(uploaderObj.username)}`}
          className="flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1f1f1f] hover:opacity-80 transition-opacity">
            {(uploaderObj.avatar || avatarUrl) ? (
              <Image
                src={uploaderObj.avatar || avatarUrl || ''}
                alt={`${uploaderObj.username}'s avatar`}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1f1f1f]">
                <RiUser3Line className="text-[#666] text-lg" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link 
            href={`/watch?v=${video.slug || video.id}`}
            className="block group"
          >
            <h3 className="font-medium text-white text-sm font-inter leading-5 group-hover:text-[#d6d203] transition-colors duration-200 line-clamp-2">
              {video.title}
            </h3>
          </Link>

          <div className="mt-[1.5px]">
            <div className="flex items-center font-pop flex-wrap gap-1.5 text-xs">
              <Link 
                href={`/profile?user=${encodeURIComponent(uploaderObj.username)}`} 
                className="text-[#aaa] hover:text-[#d6d203] font-pop transition-colors duration-200"
              >
                {uploaderObj.username}
              </Link>
              <span className="text-[#666]">•</span>
              <span className="text-[#aaa]">{formatCount(video.views)} views</span>
              <span className="text-[#666]">•</span>
              <span className="text-[#d6d203bb]">{likePercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;