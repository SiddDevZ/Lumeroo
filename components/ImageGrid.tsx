"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaEye, FaUser } from "react-icons/fa";
import { FaRegImage } from "react-icons/fa6";
import { VideoType, UploaderType } from "./Types";

interface ImageGridProps {
  videos: VideoType[];
}

const ImageCard = ({ 
  video, 
  totalImages, 
  columnIndex 
}: { 
  video: VideoType; 
  totalImages: number; 
  columnIndex: number; 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const username = typeof video.uploader === 'object' ? video.uploader.username : video.uploader;
    router.push(`/profile?user=${username}`);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const trimText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const trimUsername = (username: string | UploaderType) => {
    if (typeof username === 'object' && username.username) {
      return trimText(username.username, 12);
    }
    const usernameString = typeof username === 'string' ? username : username.toString();
    return trimText(usernameString, 12);
  };

  const trimTitle = (title: string) => {
    return trimText(title, 40);
  };

  const getThumbnailUrl = () => {
    if (video.imageUrls && Array.isArray(video.imageUrls)) {
      const thumbnailIndex = video.thumbnailIndex || 0;
      return video.imageUrls[thumbnailIndex] || video.imageUrls[0];
    }
    return video.thumbnail || 'logo.png';
  };

  const getImageCount = () => {
    if (video.imageUrls && Array.isArray(video.imageUrls)) {
      return video.imageUrls.length;
    }
    return 1;
  };

  return (
    <Link 
      href={`/watch?v=${video.slug || video._id || video.id}`}
      className="block"
    >
      <div 
        className="group relative cursor-pointer rounded-xl overflow-hidden bg-[#111111] break-inside-avoid mb-3 sm:mb-4 hover:scale-[1.02] transition-transform duration-300 ease-out"
      >
        <div className="relative">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse rounded-xl" />
          )}
          <Image
            src={getThumbnailUrl()}
            alt={video.title}
            width={400}
            height={600}
            className={`w-full h-auto object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            style={{
              aspectRatio: `auto ${1 + Math.random() * 0.1}`,
            }}
          />

          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
            <div className="absolute inset-0 p-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-1.5 bg-black/80 rounded-full px-2 py-1">
                  <FaEye className="text-white text-xs" />
                  <span className="text-white text-xs font-medium">{formatViews(video.views)}</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-black/80 rounded-full px-2 py-1">
                  <FaRegImage className="text-white text-xs" />
                  <span className="text-white text-xs font-medium">{getImageCount()}</span>
                </div>
              </div>

              <div className="bg-black/80 rounded-lg p-2">
                <h3 className="text-white font-semibold text-[10px] sm:text-xs mb-1.5 line-clamp-2 leading-relaxed">
                  {trimTitle(video.title)}
                </h3>
                <div className="flex items-center justify-between">
                  <div 
                    onClick={handleUsernameClick}
                    className="flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FaUser className="text-[#e0e0e0] text-[8px] sm:text-xs" />
                    <span className="text-[#e0e0e0] text-[9px] sm:text-xs font-medium hover:text-[#d6d203] transition-colors duration-200">
                      {trimUsername(video.uploader)}
                    </span>
                  </div>
                  <span className="text-[#e0e0e0] text-[9px] sm:text-xs">{video.uploadDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ImageGrid = ({ videos }: ImageGridProps) => {
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width >= 1280) setColumnCount(4);
      else if (width >= 1024) setColumnCount(4); 
      else if (width >= 768) setColumnCount(3);
      else setColumnCount(2);
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/50 text-lg">No images found</p>
      </div>
    );
  }

  const totalImages = videos.length;

  const columns: VideoType[][] = Array.from({ length: columnCount }, () => []);
  videos.forEach((video, index) => {
    columns[index % columnCount].push(video);
  });

  return (
    <div className="w-full">
      <div className="flex gap-2.5 sm:gap-4">
        {columns.map((columnVideos, columnIndex) => (
          <div key={columnIndex} className="flex-1 space-y-3 sm:space-y-4">
            {columnVideos.map((video) => (
              <ImageCard 
                key={video._id || video.id} 
                video={video} 
                totalImages={totalImages} 
                columnIndex={columnIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGrid;