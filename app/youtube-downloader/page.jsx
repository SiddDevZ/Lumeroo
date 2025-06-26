"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FiDownload, FiLink, FiPlay, FiEye, FiCheck, FiX, FiLoader, FiMonitor, FiUpload } from "react-icons/fi";
import { RiVideoLine } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { Toaster, toast } from "sonner";
import NavBar from "../../components/NavBar";
import Link from "next/link";
import config from "../../config.json";
import { SiYoutube } from "react-icons/si";

const YouTubeDownloader = () => {
  const [user, setUser] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [showUrlHelp, setShowUrlHelp] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${config.url}/api/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      }
    };

    checkAuthentication();
  }, []);

  const validateYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      inputRef.current?.focus();
      return;
    }

    if (!validateYouTubeUrl(videoUrl)) {
      toast.error("Please enter a valid YouTube URL");
      setShowUrlHelp(true);
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setVideoInfo(null);
    setSelectedQuality("");
    setShowUrlHelp(false);

    try {
      const response = await fetch(`http://localhost:3002/api/youtube-downloader/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl, includeDescription: true }),
      });

      const data = await response.json();

      if (data.success && data.videoInfo) {
        setVideoInfo(data.videoInfo);
        // toast.success("Video information loaded successfully!");
      } else {
        toast.error(data.message || "Failed to fetch video information");
      }

    } catch (error) {
      console.error("Error fetching video info:", error);
      toast.error("Failed to fetch video information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedQuality || !videoInfo) {
      toast.error("Please select a quality first");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(`http://localhost:3002/api/youtube-downloader/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: videoUrl, 
          quality: selectedQuality 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Get the file blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${videoInfo.title.replace(/[<>:"/\\|?*]/g, '_')}_${selectedQuality}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Video downloaded successfully in ${selectedQuality}!`);
      
      // Reset states
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);

    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.message || "Download failed. Please try again.");
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedQuality || !videoInfo) {
      toast.error("Please select a quality first");
      return;
    }

    if (!user) {
      toast.error("Please login to upload videos to Lumeroo");
      return;
    }

    setIsUploading(true);

    try {
      toast.info("Processing upload...");
      
      // Create FormData for the new backend route
      const formData = new FormData();
      formData.append('url', videoUrl);
      formData.append('quality', selectedQuality);
      formData.append('token', localStorage.getItem('token'));

      // Use the new backend route that handles everything
      const uploadResponse = await fetch(`http://localhost:3002/api/youtube-upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.success) {
        toast.success("Video uploaded to Lumeroo successfully!");

        setVideoUrl("");
        setVideoInfo(null);
        setSelectedQuality("");
        setShowUrlHelp(false);
      } else {
        throw new Error(uploadData.message || 'Upload to Lumeroo failed');
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  const formatFileSize = (size) => size;
  const formatDuration = (duration) => duration;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <NavBar user={user} setUser={setUser} showCategories={false} />
      <Toaster theme="dark" position="bottom-right" richColors />

      <div className="max-w-[79rem] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[1.7rem] sm:text-3xl leading-0 font-bold text-white flex items-center">
              <RiVideoLine className="mr-3 text-[#d6d203] text-3xl sm:text-4xl" />
              YouTube Downloader
            </h1>
          </div>
          <p className="text-[#a0a0a0] text-base sm:text-lg mt-1">
            Download YouTube videos in high quality
          </p>
        </div>

        <div className="bg-[#0e0e0e] border border-[#2b2b2b] rounded-xl py-4 px-5 sm:py-6 sm:px-6 mb-8">
          <div className="mb-4">
            <label className="block text-white font-medium mb-3">
              YouTube Video URL
            </label>
            <div className="relative">
              <div className="flex items-center w-full border border-[#1f1f1f] bg-[#101010] rounded-lg py-3 px-4 focus-within:border-[#d6d203] focus-within:shadow-[0_0_20px_rgba(214,210,3,0.1)] transition-all duration-300">
                <FiLink className="text-[#939393] text-lg mr-3 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="flex-1 text-[1rem] bg-transparent text-[#c0c0c0] placeholder-[#808080] focus:outline-none"
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                />
                {videoUrl && (
                  <button
                    onClick={() => setVideoUrl("")}
                    className="text-[#999] hover:text-[#d6d203] ml-2 p-1 rounded transition-colors duration-200"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </div>

            {showUrlHelp && (
              <div className="mt-3 p-3 bg-[#1a1a1a] border border-[#d6d203]/30 rounded-lg">
                <p className="text-[#d6d203] text-sm font-medium mb-2">Valid YouTube URL formats:</p>
                <ul className="text-[#ccc] text-sm space-y-1">
                  <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>• https://youtu.be/VIDEO_ID</li>
                  <li>• https://www.youtube.com/embed/VIDEO_ID</li>
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleUrlSubmit}
            disabled={isLoading || !videoUrl.trim()}
            className={`
              flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2.5 cursor-pointer rounded-lg font-medium transition-all duration-300 transform
              ${isLoading || !videoUrl.trim()
                ? 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                : 'bg-[#d6d203] text-[#202020] hover:bg-[#c9be03] hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2" size={18} />
                Fetching Video Info...
              </>
            ) : (
              <>
                <IoSearchSharp className="mr-2" size={18} />
                Get Video Info
              </>
            )}
          </button>
        </div>

        {videoInfo && (
          <div className="bg-[#0e0e0e] border border-[#2b2b2b] rounded-xl p-6 mb-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a1a] group">
                  <Image
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    fill
                    className="object-cover transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/640/360';
                    }}
                  />
                </div>

                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-white mb-3 line-clamp-2 leading-tight">
                    {videoInfo.title}
                  </h2>
                  
                  <div className="space-x-5 flex text-sm text-[#ccc]">
                    <div className="flex items-center gap-2">
                      <FiEye className="text-[#d6d203]" size={14} />
                      <span>{videoInfo.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMonitor className="text-[#d6d203]" size={14} />
                      <span>MP4 Format</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Select Quality</h3>
                
                <div className={`grid grid-cols-2 gap-3 h-fit ${
                  videoInfo.qualities.length > 6 
                    ? 'max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#d6d203]/30 scrollbar-track-[#1a1a1a]' 
                    : ''
                }`}>
                  {videoInfo.qualities.map((quality, index) => (
                    <div
                      key={quality.quality}
                      onClick={() => setSelectedQuality(quality.quality)}
                      className={`
                        relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform flex flex-col justify-between min-h-[100px]
                        ${selectedQuality === quality.quality
                          ? 'border-[#d6d203] bg-[#d6d203]/10 shadow-lg'
                          : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#d6d203]/50 hover:bg-[#d6d203]/5'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-base">{quality.quality}</span>
                        {selectedQuality === quality.quality && (
                          <div className="w-5 h-5 rounded-full bg-[#d6d203] flex items-center justify-center">
                            <FiCheck className="text-[#202020]" size={12} />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#999]">Format:</span>
                          <span className="text-[#ccc] font-medium">{quality.format.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#999]">Size:</span>
                          <span className="text-[#ccc] font-medium">{formatFileSize(quality.size)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#999]">FPS:</span>
                          <span className="text-[#ccc] font-medium">{quality.fps}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {videoInfo && (
          <div className="flex justify-center mb-8 opacity-0 animate-[fadeIn_0.5s_ease-out_0.4s_forwards]">
            <div className="w-full max-w-md space-y-3">
              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!selectedQuality || isDownloading || isUploading}
                className={`
                  flex items-center justify-center w-full px-2 py-3.5 rounded-lg font-bold text-lg transition-all duration-300 transform cursor-pointer
                  ${!selectedQuality || isDownloading || isUploading
                    ? 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                    : 'bg-[#d6d203] text-[#202020] hover:bg-[#c9be03] hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {isDownloading ? (
                  <>
                    <FiLoader className="animate-spin mr-3" size={20} />
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload className="mr-3" size={20} />
                    Download {selectedQuality && `in ${selectedQuality}`}
                  </>
                )}
              </button>

              {/* Upload Button */}
              {user && (
                <button
                  onClick={handleUpload}
                  disabled={!selectedQuality || isDownloading || isUploading}
                  className={`
                    flex items-center justify-center w-full px-2 py-3.5 rounded-lg font-bold text-lg transition-all duration-300 transform cursor-pointer
                    ${!selectedQuality || isDownloading || isUploading
                      ? 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                      : 'bg-[#28a745] text-white hover:bg-[#218838] hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="animate-spin mr-3" size={20} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-3" size={20} />
                      Upload to Lumeroo
                    </>
                  )}
                </button>
              )}

              {!user && (
                <div className="text-center p-3 bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg">
                  <p className="text-[#999] text-sm mb-2">Want to upload to Lumeroo?</p>
                  <Link href="/login" className="text-[#d6d203] hover:text-[#c9be03] font-medium text-sm">
                    Login to upload videos
                  </Link>
                </div>
              )}

              {selectedQuality && !isDownloading && !isUploading && (
                <p className="text-[#999] text-sm mt-3 text-center">
                  You selected {selectedQuality} quality • {videoInfo.qualities.find(q => q.quality === selectedQuality)?.size}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-[#0e0e0e] border border-[#2b2b2b] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-[#d6d203]/20 flex items-center justify-center mx-auto mb-3">
                <FiLink className="text-[#d6d203]" size={24} />
              </div>
              <h4 className="text-white font-medium mb-2">1. Paste URL</h4>
              <p className="text-[#999] text-sm">
                Copy and paste the YouTube video URL you want to download
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-[#d6d203]/20 flex items-center justify-center mx-auto mb-3">
                <IoSearchSharp className="text-[#d6d203]" size={24} />
              </div>
              <h4 className="text-white font-medium mb-2">2. Choose Quality</h4>
              <p className="text-[#999] text-sm">
                Select your preferred video quality and format from available options
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-[#d6d203]/20 flex items-center justify-center mx-auto mb-3">
                <FiDownload className="text-[#d6d203]" size={24} />
              </div>
              <h4 className="text-white font-medium mb-2">3. Download</h4>
              <p className="text-[#999] text-sm">
                Click download and save the video to your device
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default YouTubeDownloader;