"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import "remixicon/fonts/remixicon.css";
import VideoGrid from "@/components/VideoGrid";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaShare,
  FaBell,
  FaCommentAlt,
  FaList,
  FaFireAlt,
} from "react-icons/fa";
import { FaFlag } from "react-icons/fa6";
// import { Stream } from "@cloudflare/stream-react";
import { Toaster, toast } from "sonner";
import config from "@/config.json";
import useUserAvatar from '@/hooks/useUserAvatar';
import AuthModel from "@/components/authModel";
import HLSVideoPlayer from '@/components/HLSVideoPlayer';

interface VideoUploader {
  _id: string;
  username: string;
  avatar?: string;
  avatarColor?: string;
  subscriberCount: number;
}

interface VideoData {
  _id: string;
  id: string;
  title: string;
  description?: string;
  slug: string;
  videoUrl: string;
  thumbnail?: string;
  duration: string;
  views: number;
  likedBy: string[];
  dislikedBy: string[];
  tags?: string[];
  cloudflareStreamId: string;
  createdAt: string;
  uploader: VideoUploader;
  comments?: CommentData[];
  contentType?: string; // 'video' or 'image'
  imageUrls?: string[];
  thumbnailIndex?: number;
}

interface CommentUser {
  _id: string;
  username: string;
  avatar?: string;
  avatarColor?: string;
}

interface ReplyData {
  _id: string;
  user: string;
  username: string;
  avatar?: string;
  avatarColor?: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface CommentData {
  _id: string;
  user: string;
  username: string;
  avatar?: string;
  avatarColor?: string;
  content: string;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  createdAt: string;
  replies?: ReplyData[];
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface CommentsResponse {
  success: boolean;
  comments: CommentData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalComments: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

const getRelativeTimeFromDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  }
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return count.toString();
  }
};

const WatchPageLoading = () => {
  return (
    <div className="bg-[#080808] min-h-screen w-full">
      <NavBar />
      <div className="max-w-[80rem] mx-auto px-0 pt-2 pb-8">
        <div className="w-full mb-4">
          <div className="animate-pulse">
            <div className="w-full aspect-video bg-[#1a1a1a] rounded-lg mb-4"></div>
          </div>
        </div>
        <div className="mb-4 bg-[#121212] rounded-lg p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 md:h-8 bg-[#1a1a1a] rounded-lg mb-2 w-3/4"></div>
            <div className="h-6 md:h-8 bg-[#1a1a1a] rounded-lg mb-4 w-1/2"></div>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 bg-[#1a1a1a] rounded w-20"></div>
              <div className="w-1 h-1 bg-[#1a1a1a] rounded-full"></div>
              <div className="h-4 bg-[#1a1a1a] rounded w-16"></div>
            </div>

            <div className="md:hidden flex flex-wrap gap-2 mb-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-[#1a1a1a] rounded-full w-20"></div>
              ))}
            </div>

            <div className="hidden md:flex flex-wrap gap-y-5 mt-2 justify-between items-center">
              <div className="flex items-center gap-3 py-1">
                <div className="w-11.5 h-11.5 bg-[#1a1a1a] rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#1a1a1a] rounded w-24"></div>
                  <div className="h-3 bg-[#1a1a1a] rounded w-20"></div>
                </div>
                <div className="h-6 w-px bg-[#1a1a1a] mx-2"></div>
                <div className="h-9 bg-[#1a1a1a] rounded-lg w-24"></div>
              </div>

              <div className="flex items-center gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-[#1a1a1a] rounded-lg w-20"></div>
                ))}
              </div>
            </div>

            <div className="md:hidden flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg mb-5">
              <div className="w-10 h-10 bg-[#252525] rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#252525] rounded w-24"></div>
                <div className="h-3 bg-[#252525] rounded w-20"></div>
              </div>
              <div className="h-8 bg-[#252525] rounded-lg w-20"></div>
            </div>

            <div className="mt-5 pt-5 border-t border-[#2a2a2a] space-y-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 bg-[#1a1a1a] rounded-full w-16"></div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#1a1a1a] rounded w-full"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-5/6"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-0">
          <div className="mb-4 border-b border-[#2a2a2a]">
            <div className="flex gap-4 animate-pulse">
              <div className="h-10 bg-[#1a1a1a] rounded-t w-32"></div>
              <div className="h-10 bg-[#1a1a1a] rounded-t w-32"></div>
              <div className="h-10 bg-[#1a1a1a] rounded-t w-24"></div>
            </div>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={`skeleton-${index}`} className="animate-pulse">
                  <div className="aspect-video bg-[#1a1a1a] rounded-lg mb-2">
                    <div className="w-full h-full bg-[#252525] rounded-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#1a1a1a] rounded w-full"></div>
                    <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center mt-2 space-x-2">
                    <div className="h-3 bg-[#1a1a1a] rounded w-20"></div>
                    <div className="h-3 bg-[#1a1a1a] rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-6 px-1 lg:px-0">
              <div className="h-6 bg-[#1a1a1a] rounded w-32 animate-pulse"></div>
              <div className="h-8 bg-[#1a1a1a] rounded w-32 animate-pulse"></div>
            </div>

            <div className="mb-8 flex gap-3 px-1 lg:px-0 animate-pulse">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex-shrink-0"></div>
              <div className="flex-grow">
                <div className="h-12 bg-[#1a1a1a] rounded-lg"></div>
              </div>
            </div>

            <div className="space-y-3 px-1 lg:px-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-2.5 bg-[#111]/30 rounded-lg p-3 border border-[#2a2a2a]/40">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-full"></div>
                  <div className="flex-grow space-y-2">
                    <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
                    <div className="h-3 bg-[#2a2a2a] rounded w-full"></div>
                    <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
                    <div className="flex gap-3 mt-2">
                      <div className="h-3 bg-[#2a2a2a] rounded w-8"></div>
                      <div className="h-3 bg-[#2a2a2a] rounded w-8"></div>
                      <div className="h-3 bg-[#2a2a2a] rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WatchPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const videoSlug = searchParams.get("v") as string;
  const [video, setVideo] = useState<VideoData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [commentSort, setCommentSort] = useState<'recent' | 'popular' | 'oldest'>('recent');
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [isPostingReply, setIsPostingReply] = useState<{[key: string]: boolean}>({});
  const [showReplyBox, setShowReplyBox] = useState<{[key: string]: boolean}>({});
  const [commentActionCooldown, setCommentActionCooldown] = useState<{[key: string]: boolean}>({});
  const [relatedVideos, setRelatedVideos] = useState<VideoData[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<VideoData[]>([]);
  const [activeTab, setActiveTab] = useState<"related" | "recommended">(
    "related"
  );
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingMoreRelated, setLoadingMoreRelated] = useState(false);
  const [loadingMoreRecommended, setLoadingMoreRecommended] = useState(false);
  const [viewedRelatedIds, setViewedRelatedIds] = useState<Set<string>>(new Set());
  const [viewedRecommendedIds, setViewedRecommendedIds] = useState<Set<string>>(new Set());
  const [relatedHasMore, setRelatedHasMore] = useState(true);
  const [recommendedHasMore, setRecommendedHasMore] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeDislikeCooldown, setLikeDislikeCooldown] = useState(false);
  const [subscribeCooldown, setSubscribeCooldown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);
  const [uploaderProfile, setUploaderProfile] = useState<any>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentThumbnailPage, setCurrentThumbnailPage] = useState(0);

  const streamContainerRef = useRef<HTMLDivElement>(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading video...");
  const { avatarUrl: uploaderAvatarUrl } = useUserAvatar(uploaderProfile) as { avatarUrl: string; isLoading: boolean };

  const memoizedVideoPlayer = useMemo(() => {
    if (video?.contentType === 'image' || !video?.videoUrl) return null;
    
    return (
      <HLSVideoPlayer
        src={config.stream + video.videoUrl}
        poster={video.thumbnail ? config.stream + video.thumbnail : undefined}
        onLoadedMetadata={() => handleVideoLoad()}
        onError={() => setLoadingMessage("Error 404 - Video not found")}
        className={`w-full h-full ${isLoading ? "hidden" : ""}`}
        autoplay={false}
        muted={false}
        controls={true}
      />
    );
  }, [video?.videoUrl, video?.thumbnail, isLoading]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const isCurrentUserUploader = user && video?.uploader?._id && user._id === video.uploader._id;
  const THUMBNAILS_PER_PAGE_DESKTOP = 6; // 3x2 grid
  const THUMBNAILS_PER_PAGE_MOBILE = 6; // 3x2 grid
  const getThumbnailsPerPage = () => {
    return window.innerWidth >= 1024 ? THUMBNAILS_PER_PAGE_DESKTOP : THUMBNAILS_PER_PAGE_MOBILE;
  };

  const getTotalPages = (imageUrls: string[]) => {
    const thumbnailsPerPage = getThumbnailsPerPage();
    return Math.ceil(imageUrls.length / thumbnailsPerPage);
  };

  const getCurrentPageThumbnails = (imageUrls: string[]) => {
    const thumbnailsPerPage = getThumbnailsPerPage();
    const startIndex = currentThumbnailPage * thumbnailsPerPage;
    return imageUrls.slice(startIndex, startIndex + thumbnailsPerPage);
  };

  useEffect(() => {
    if (video?.imageUrls) {
      const thumbnailsPerPage = getThumbnailsPerPage();
      const pageWithCurrentImage = Math.floor(currentImageIndex / thumbnailsPerPage);
      setCurrentThumbnailPage(pageWithCurrentImage);
    }
  }, [currentImageIndex, video?.imageUrls]);

  const handlePreviousPage = () => {
    setCurrentThumbnailPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    if (video?.imageUrls) {
      const totalPages = getTotalPages(video.imageUrls);
      setCurrentThumbnailPage(prev => Math.min(totalPages - 1, prev + 1));
    }
  };

  const fetchRelatedVideos = async (videoId: string, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMoreRelated(true);
      } else {
        setLoadingRelated(true);
        setViewedRelatedIds(new Set());
        setRelatedHasMore(true);
      }

      const url = new URL(`${config.url}/api/related/${videoId}`);
      url.searchParams.append('limit', '12');
      
      if (isLoadMore && viewedRelatedIds.size > 0) {
        const excludeIds = Array.from(viewedRelatedIds).join(',');
        url.searchParams.append('excludeIds', excludeIds);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success && data.videos) {
        if (isLoadMore) {
          setRelatedVideos(prev => [...prev, ...data.videos]);
        } else {
          setRelatedVideos(data.videos);
        }

        setViewedRelatedIds(prev => {
          const newSet = new Set(prev);
          data.videos.forEach((video: VideoData) => newSet.add(video._id));
          return newSet;
        });

        if (data.videos.length < 12) {
          setRelatedHasMore(false);
        }
      } else {
        if (!isLoadMore) {
          setRelatedVideos([]);
        }
        setRelatedHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching related videos:', error);
      if (!isLoadMore) {
        setRelatedVideos([]);
      }
      setRelatedHasMore(false);
    } finally {
      if (isLoadMore) {
        setLoadingMoreRelated(false);
      } else {
        setLoadingRelated(false);
      }
    }
  };

  const fetchRecommendedVideos = async (excludeId?: string, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMoreRecommended(true);
      } else {
        setLoadingRecommended(true);
        setViewedRecommendedIds(new Set());
        setRecommendedHasMore(true);
      }

      const url = new URL(`${config.url}/api/recommended`);
      url.searchParams.append('limit', '12');
      if (excludeId) {
        url.searchParams.append('excludeId', excludeId);
      }

      if (isLoadMore && viewedRecommendedIds.size > 0) {
        const excludeIds = Array.from(viewedRecommendedIds);
        if (excludeId) excludeIds.push(excludeId);
        url.searchParams.append('excludeIds', excludeIds.join(','));
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success && data.videos) {
        if (isLoadMore) {
          setRecommendedVideos(prev => [...prev, ...data.videos]);
        } else {
          setRecommendedVideos(data.videos);
        }

        setViewedRecommendedIds(prev => {
          const newSet = new Set(prev);
          data.videos.forEach((video: VideoData) => newSet.add(video._id));
          return newSet;
        });

        if (data.videos.length < 12) {
          setRecommendedHasMore(false);
        }
      } else {
        if (!isLoadMore) {
          setRecommendedVideos([]);
        }
        setRecommendedHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching recommended videos:', error);
      if (!isLoadMore) {
        setRecommendedVideos([]);
      }
      setRecommendedHasMore(false);
    } finally {
      if (isLoadMore) {
        setLoadingMoreRecommended(false);
      } else {
        setLoadingRecommended(false);
      }
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const url = token 
          ? `${config.url}/api/content/${videoSlug}?token=${token}`
          : `${config.url}/api/content/${videoSlug}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.content) {
          const contentType = data.type;

          const mappedContent: VideoData = {
            ...data.content,
            id: data.content._id,
            uploader: data.content.uploader || {},
            comments: data.content.comments || [],
            videoUrl: contentType === 'image' ? '' : data.content.videoUrl,
            thumbnail: contentType === 'image' ? 
              (data.content.imageUrls && data.content.imageUrls[data.content.thumbnailIndex || 0]) : 
              data.content.thumbnail,
            duration: contentType === 'image' ? '0:00' : data.content.duration,
            cloudflareStreamId: contentType === 'image' ? '' : data.content.cloudflareStreamId,
            contentType: contentType,
            imageUrls: contentType === 'image' ? data.content.imageUrls : undefined,
            thumbnailIndex: contentType === 'image' ? data.content.thumbnailIndex : undefined
          };
          
          setVideo(mappedContent);
          setComments(data.content.comments || []);

          setCurrentImageIndex(data.content.thumbnailIndex || 0);

          setLikeCount(data.content.likeCount || 0);
          setDislikeCount(data.content.dislikeCount || 0);
          
          if (data.content.userInteractionStatus) {
            setIsLiked(data.content.userInteractionStatus.isLiked);
            setIsDisliked(data.content.userInteractionStatus.isDisliked);
          }

          if (data.content.userSubscriptionStatus) {
            setIsSubscribed(data.content.userSubscriptionStatus.isSubscribed);
          }

          setSubscriberCount(data.content.uploader?.subscriberCount || 0);
          
          if (data.content.uploader?.username) {
            fetchUploaderProfile(data.content.uploader.username);
          }
          if (contentType === 'video') {
            fetchRelatedVideos(data.content._id);
            fetchRecommendedVideos(data.content._id);
          }
        } else {
          setError('the content you are looking for is not found');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoSlug) {
      setVideo(null);
      setComments([]);
      setRelatedVideos([]);
      setRecommendedVideos([]);
      setUploaderProfile(null);
      setError(null);
      setIsLiked(false);
      setIsDisliked(false);
      setIsSubscribed(false);
      setLikeCount(0);
      setDislikeCount(0);
      setSubscriberCount(0);
      setCurrentImageIndex(0);
      setCurrentThumbnailPage(0);
      setTotalComments(0);
      setCommentsPage(1);
      setHasMoreComments(true);
      setCommentSort('recent');
      setNewComment('');
      setExpandedReplies(new Set());
      setReplyText({});
      setShowReplyBox({});
      setLoadingMessage("Loading video...");
      
      fetchVideo();
    }
  }, [videoSlug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (video?.contentType === 'image' && video.imageUrls && video.imageUrls.length > 1) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setCurrentImageIndex(prev => 
            prev === 0 ? video.imageUrls!.length - 1 : prev - 1
          );
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          setCurrentImageIndex(prev => 
            prev === video.imageUrls!.length - 1 ? 0 : prev + 1
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [video?.contentType, video?.imageUrls]);

  const fetchUploaderProfile = async (username: string) => {
    try {
      const response = await fetch(`${config.url}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        setUploaderProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching uploader profile:', error);
    }
  };

  const handleUploaderClick = () => {
    if (video?.uploader?.username) {
      router.push(`/profile?user=${video.uploader.username}`);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!video?._id || likeDislikeCooldown) return;

    setLikeDislikeCooldown(true);
    setTimeout(() => setLikeDislikeCooldown(false), 300);

    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    if (wasLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      if (wasDisliked) {
        setIsDisliked(false);
        setDislikeCount(prev => prev - 1);
      }
    }

    fetch(`${config.url}/api/interactions/toggle-like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        contentId: video._id,
        contentType: video.contentType === 'image' ? 'image' : 'video',
        action: 'like'
      }),
    }).catch(error => {
      console.error('Error liking content:', error);
    });
  };

  const handleDislike = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!video?._id || likeDislikeCooldown) return;

    setLikeDislikeCooldown(true);
    setTimeout(() => setLikeDislikeCooldown(false), 300);

    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    if (wasDisliked) {
      setIsDisliked(false);
      setDislikeCount(prev => prev - 1);
    } else {
      setIsDisliked(true);
      setDislikeCount(prev => prev + 1);
      if (wasLiked) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    }

    fetch(`${config.url}/api/interactions/toggle-like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        contentId: video._id,
        contentType: video.contentType === 'image' ? 'image' : 'video',
        action: 'dislike'
      }),
    }).catch(error => {
      console.error('Error disliking content:', error);
    });
  };

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!video?.uploader?._id || subscribeCooldown) return;

    setSubscribeCooldown(true);
    setTimeout(() => setSubscribeCooldown(false), 300);

    const wasSubscribed = isSubscribed;
    setIsSubscribed(!wasSubscribed);
    setSubscriberCount(prev => wasSubscribed ? prev - 1 : prev + 1);

    try {
      const response = await fetch(`${config.url}/api/interactions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          targetUserId: video.uploader._id
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        setIsSubscribed(wasSubscribed);
        setSubscriberCount(prev => wasSubscribed ? prev + 1 : prev - 1);
        console.error('Subscription failed:', data.message);
      }
    } catch (error) {
      setIsSubscribed(wasSubscribed);
      setSubscriberCount(prev => wasSubscribed ? prev + 1 : prev - 1);
      console.error('Error updating subscription:', error);
    }
  };

  const scrollToComments = () => {
    setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const loadMoreRelated = () => {
    if (video?._id && relatedHasMore && !loadingMoreRelated) {
      fetchRelatedVideos(video._id, true);
    }
  };

  const loadMoreRecommended = () => {
    if (recommendedHasMore && !loadingMoreRecommended) {
      fetchRecommendedVideos(video?._id, true);
    }
  };

  const fetchComments = async (page: number = 1, sort: string = 'recent', reset: boolean = false) => {
    if (!video?._id) return;
    
    try {
      setCommentsLoading(true);
      const contentType = video.contentType === 'image' ? 'image' : 'video';

      const url = new URL(`${config.url}/api/comments/${contentType}/${video._id}`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '20');
      url.searchParams.append('sort', sort);

      const token = localStorage.getItem('token');
      if (token) {
        url.searchParams.append('token', token);
      }
      
      const response = await fetch(url.toString());
      const data: CommentsResponse = await response.json();
      
      if (data.success) {
        if (reset || page === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setTotalComments(data.pagination.totalComments);
        setHasMoreComments(data.pagination.hasNextPage);
        setCommentsPage(page);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || isPostingComment || !video?._id) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsPostingComment(true);
      const contentType = video.contentType === 'image' ? 'image' : 'video';
      const response = await fetch(
        `${config.url}/api/comments/${contentType}/${video._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newComment,
            token: token
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        setComments(prev => [data.comment, ...prev]);
        setTotalComments(prev => prev + 1);
      } else {
        alert(data.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePostReply = async (commentId: string) => {
    const content = replyText[commentId];
    if (!content?.trim() || isPostingReply[commentId]) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    try {
      setIsPostingReply(prev => ({ ...prev, [commentId]: true }));
      const response = await fetch(
        `${config.url}/api/comments/${commentId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            token: token
          }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyBox(prev => ({ ...prev, [commentId]: false }));
        
        // Update comment with new reply
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), data.reply],
                replyCount: comment.replyCount + 1
              }
            : comment
        ));
        
        // Expand replies to show the new one
        setExpandedReplies(prev => new Set([...prev, commentId]));
      } else {
        alert(data.message || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    } finally {
      setIsPostingReply(prev => ({ ...prev, [commentId]: false }));
    }
  };

  // Handle comment/reply actions (like, dislike, delete) with optimistic updates
  const handleCommentAction = async (
    action: 'like' | 'dislike' | 'delete',
    commentId: string,
    replyId?: string
  ) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    const cooldownKey = `${commentId}-${replyId || 'comment'}-${action}`;
    if (commentActionCooldown[cooldownKey]) return;

    setCommentActionCooldown(prev => ({ ...prev, [cooldownKey]: true }));
    setTimeout(() => {
      setCommentActionCooldown(prev => ({ ...prev, [cooldownKey]: false }));
    }, 300);

    let originalComment: CommentData | undefined;
    let originalReply: ReplyData | undefined;

    if (replyId) {
      const comment = comments.find(c => c._id === commentId);
      originalReply = comment?.replies?.find(r => r._id === replyId);
    } else {
      originalComment = comments.find(c => c._id === commentId);
    }

    if (action === 'delete') {
      if (replyId) {
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? { 
                ...comment, 
                replies: comment.replies?.filter(reply => reply._id !== replyId),
                replyCount: Math.max(0, comment.replyCount - 1)
              }
            : comment
        ));
      } else {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        setTotalComments(prev => Math.max(0, prev - 1));
      }
    } else {
      if (replyId && originalReply) {
        const wasLiked = originalReply.isLiked;
        const wasDisliked = originalReply.isDisliked;
        
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                replies: comment.replies?.map(reply => 
                  reply._id === replyId
                    ? {
                        ...reply,
                        likeCount: action === 'like' 
                          ? (wasLiked ? reply.likeCount - 1 : reply.likeCount + 1)
                          : (wasLiked ? reply.likeCount - 1 : reply.likeCount),
                        dislikeCount: action === 'dislike'
                          ? (wasDisliked ? reply.dislikeCount - 1 : reply.dislikeCount + 1)
                          : (wasDisliked ? reply.dislikeCount - 1 : reply.dislikeCount),
                        isLiked: action === 'like' ? !wasLiked : false,
                        isDisliked: action === 'dislike' ? !wasDisliked : false
                      }
                    : reply
                )
              }
            : comment
        ));
      } else if (originalComment) {
        const wasLiked = originalComment.isLiked;
        const wasDisliked = originalComment.isDisliked;
        
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? {
                ...comment,
                likeCount: action === 'like' 
                  ? (wasLiked ? comment.likeCount - 1 : comment.likeCount + 1)
                  : (wasLiked ? comment.likeCount - 1 : comment.likeCount),
                dislikeCount: action === 'dislike'
                  ? (wasDisliked ? comment.dislikeCount - 1 : comment.dislikeCount + 1)
                  : (wasDisliked ? comment.dislikeCount - 1 : comment.dislikeCount),
                isLiked: action === 'like' ? !wasLiked : false,
                isDisliked: action === 'dislike' ? !wasDisliked : false
              }
            : comment
        ));
      }
    }

    try {
      const response = await fetch(`${config.url}/api/comments/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          replyId,
          action,
          token
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Action failed:', data.message);
        
        if (action === 'delete') {
          if (replyId && originalReply) {
            setComments(prev => prev.map(comment => 
              comment._id === commentId 
                ? { 
                    ...comment, 
                    replies: [...(comment.replies || []), originalReply],
                    replyCount: comment.replyCount + 1
                  }
                : comment
            ));
          } else if (originalComment) {
            setComments(prev => [...prev, originalComment].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
            setTotalComments(prev => prev + 1);
          }
        } else {
          if (replyId && originalReply) {
            setComments(prev => prev.map(comment => 
              comment._id === commentId 
                ? {
                    ...comment,
                    replies: comment.replies?.map(reply => 
                      reply._id === replyId ? originalReply : reply
                    )
                  }
                : comment
            ));
          } else if (originalComment) {
            setComments(prev => prev.map(comment => 
              comment._id === commentId ? originalComment : comment
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error performing comment action:', error);

      if (action === 'delete') {
        if (replyId && originalReply) {
          setComments(prev => prev.map(comment => 
            comment._id === commentId 
              ? { 
                  ...comment, 
                  replies: [...(comment.replies || []), originalReply],
                  replyCount: comment.replyCount + 1
                }
              : comment
          ));
        } else if (originalComment) {
          setComments(prev => [...prev, originalComment].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
          setTotalComments(prev => prev + 1);
        }
      } else {
        if (replyId && originalReply) {
          setComments(prev => prev.map(comment => 
            comment._id === commentId 
              ? {
                  ...comment,
                  replies: comment.replies?.map(reply => 
                    reply._id === replyId ? originalReply : reply
                  )
                }
              : comment
          ));
        } else if (originalComment) {
          setComments(prev => prev.map(comment => 
            comment._id === commentId ? originalComment : comment
          ));
        }
      }
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const loadMoreComments = () => {
    if (hasMoreComments && !commentsLoading) {
      fetchComments(commentsPage + 1, commentSort, false);
    }
  };

  const handleSortChange = (newSort: 'recent' | 'popular' | 'oldest') => {
    setCommentSort(newSort);
    setCommentsPage(1);
    fetchComments(1, newSort, true);
  };

  const handleCommentUserClick = (username: string) => {
    router.push(`/profile?user=${username}`);
  };

  useEffect(() => {
    if (video?._id) {
      fetchComments(1, 'recent', true);
    }
  }, [video?._id]);

  useEffect(() => {
    if (comments.length > 0) {
      const commentsWithReplies = comments
        .filter(comment => comment.replyCount > 0)
        .map(comment => comment._id);
      setExpandedReplies(new Set(commentsWithReplies));
    }
  }, [comments]);

  const { avatarUrl: userAvatarUrl } = useUserAvatar(user) as { avatarUrl: string; isLoading: boolean };

  const openReportModal = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setShowReportModal(true);
    setTimeout(() => {
      setModalActive(true);
    }, 20);
  };

  const closeReportModal = () => {
    setModalActive(false);
    setTimeout(() => {
      setShowReportModal(false);
      setReportCategory('');
      setReportDetails('');
    }, 300);
  };

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportCategory) {
      toast.error('Please select a report category');
      return;
    }

    if (!video) {
      toast.error('Content not found');
      return;
    }
    setIsSubmittingReport(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.url}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          contentId: video._id,
          contentType: video.contentType === 'image' ? 'image' : 'video',
          category: reportCategory,
          details: reportDetails,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        closeReportModal();
        toast.success('Report submitted successfully');
      } else {
        toast.error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!video) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const contentType = video.contentType === 'image' ? 'image' : 'video';
      const response = await fetch(`${config.url}/api/delete/${contentType}/${video._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Content deleted successfully');
        router.push('/');
      } else {
        toast.error(data.message || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Delete content error:', error);
      toast.error('Failed to delete content');
    }
  };

  const reportCategories = [
    { id: 'illegal', label: 'Illegal or prohibited content', icon: 'ri-error-warning-line' },
    { id: 'nonconsensual', label: 'Non-consensual content', icon: 'ri-shield-user-line' },
    { id: 'underage', label: 'Suspected underage content', icon: 'ri-user-unfollow-line' },
    { id: 'copyright', label: 'Copyright infringement', icon: 'ri-copyright-line' },
    { id: 'other', label: 'Other issue', icon: 'ri-more-line' },
  ];
  
  if (error) {
    return (
      <div className="bg-[#080808] min-h-screen w-full">
        <NavBar user={user} setUser={setUser} />
        <div className="max-w-[79rem] mx-auto px-4 pt-14 pb-8 text-white text-center py-20">
          <div className="flex justify-center text-center items-center mb-2 text-white/60">
            {error}
          </div>
          <a href="/" className="text-[#d6d203] hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (!video && isLoading) {
    return <WatchPageLoading />;
  }

  if (!video) {
    return (
      <div className="bg-[#080808] min-h-screen w-full">
        <NavBar user={user} setUser={setUser} />
        <div className="max-w-[79rem] mx-auto px-4 pt-2 pb-8 text-white text-center py-20">
          <p className="text-[#a0a0a0] text-lg mb-6">Content not found</p>
          <a href="/" className="text-[#d6d203] hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Use the Cloudflare Stream ID to construct the iframe URL
  const videoSource = video.cloudflareStreamId
    ? `https://customer-jolq13ybmuso6gvq.cloudflarestream.com/${video.cloudflareStreamId}/iframe`
    : "";

  const renderVideoSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={`skeleton-${index}`} className="animate-pulse">
          <div className="aspect-video bg-[#1a1a1a] rounded-lg mb-2">
            <div className="w-full h-full bg-[#252525] rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-[#1a1a1a] rounded w-full"></div>
            <div className="h-4 bg-[#1a1a1a] rounded w-3/4"></div>
          </div>
          <div className="flex items-center mt-2 space-x-2">
            <div className="h-3 bg-[#1a1a1a] rounded w-20"></div>
            <div className="h-3 bg-[#1a1a1a] rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRelatedContent = () => {
    if (video?.contentType === 'image') {
      return (
        <div className="flex justify-center items-center py-12 text-[#a0a0a0]">
          Related content is only available for videos
        </div>
      );
    }

    if (loadingRelated) {
      return renderVideoSkeletons();
    }

    if (relatedVideos.length === 0) {
      return (
        <div className="flex justify-center items-center py-12 text-[#a0a0a0]">
          No related videos found
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {relatedVideos.map((relatedVideo) => (
            <VideoGrid key={relatedVideo._id} video={relatedVideo as any} />
          ))}
        </div>
        
        {loadingMoreRelated && (
          <div className="mt-6">
            {renderVideoSkeletons()}
          </div>
        )}
        
        {relatedHasMore && !loadingMoreRelated && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreRelated}
              className="px-5 py-2.5 bg-[#d6d203dd] hover:bg-[#d6d203d6] cursor-pointer text-[#202020] rounded-lg transition-colors duration-200 font-medium"
            >
              Load More Videos
            </button>
          </div>
        )}
      </>
    );
  };

  const renderRecommendedContent = () => {
    if (video?.contentType === 'image') {
      return (
        <div className="flex justify-center items-center py-12 text-[#a0a0a0]">
          Recommended content is only available for videos
        </div>
      );
    }

    if (loadingRecommended) {
      return renderVideoSkeletons();
    }

    if (recommendedVideos.length === 0) {
      return (
        <div className="flex justify-center items-center py-12 text-[#a0a0a0]">
          No recommended videos found
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommendedVideos.map((recommendedVideo) => (
            <VideoGrid key={recommendedVideo._id} video={recommendedVideo as any} />
          ))}
        </div>
        
        {loadingMoreRecommended && (
          <div className="mt-6">
            {renderVideoSkeletons()}
          </div>
        )}
        
        {recommendedHasMore && !loadingMoreRecommended && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreRecommended}
              className="px-5 py-2.5 bg-[#d6d203dd] hover:bg-[#d6d203d6] cursor-pointer text-[#202020] rounded-lg transition-colors duration-200 font-medium"
            >
              Load More Videos
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-[#080808] min-h-screen w-full">
      <NavBar user={user} setUser={setUser} />
      <Toaster theme="dark" position="bottom-right" richColors />      
      {showAuthModal && <AuthModel setShowAuthModel={setShowAuthModal} setUser={setUser} />}
      {showReportModal && (
        <div 
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${
            modalActive ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeReportModal();
            }
          }}
        >
          <div className={`bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#333] max-w-md w-full max-h-[90vh] overflow-hidden transition-all duration-300 ease-in-out ${
            modalActive 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}>
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#d6d203]/10 flex items-center justify-center">
                  <FaFlag className="text-[#d6d203] text-lg" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Report Content</h3>
                  <p className="text-[#a0a0a0] text-sm">Help us understand the issue</p>
                </div>
              </div>
              <button
                onClick={closeReportModal}
                className="text-[#a0a0a0] scale-[1.15] hover:text-[#bebebe] cursor-pointer transition-all hover:scale-[1.35] duration-200 rounded-lg"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="text-white font-medium mb-3">What's the issue?</h4>
                <div className="space-y-2">
                  {reportCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setReportCategory(category.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ease-in-out cursor-pointer text-left ${
                        reportCategory === category.id
                          ? 'border-[#d6d203] bg-[#d6d203]/5 text-white'
                          : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#222] text-[#d0d0d0]'
                      }`}
                    >
                      <i className={`${category.icon} text-lg transition-colors duration-200 ${
                        reportCategory === category.id ? 'text-[#d6d203]' : 'text-[#888]'
                      }`}></i>
                      <span className={`font-medium ${reportCategory === category.id ? "text-[#d6d203]" : ""}`}>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">
                  Additional details 
                  <span className="text-[#888] font-normal text-sm ml-2">(optional)</span>
                </h4>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide more context about the issue..."
                  className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#d6d203] focus:ring-1 focus:ring-[#d6d203]/30 resize-none transition-all duration-200 placeholder-[#666] hover:border-[#3a3a3a]"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#666] text-xs">
                    Help us understand the problem better
                  </span>
                  <span className="text-[#666] text-xs">
                    {reportDetails.length}/500
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2a2a2a] bg-[#161616]">
              <button
                onClick={closeReportModal}
                className="px-4 py-2 text-[#a0a0a0] cursor-pointer hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportCategory || isSubmittingReport}
                className="px-6 py-2 bg-[#d6d203f2] cursor-pointer hover:bg-[#d6d203] disabled:bg-[#666] disabled:cursor-not-allowed text-[#202020] rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaFlag className="text-sm" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[80rem] mx-auto px-0 pt-2 pb-8">

        <div className="w-full px-4 lg:px-0 mb-3">
          <div className="w-full h-28 border-2 border-dashed border-[#3a3a3a] rounded-xl bg-[#0f0f0f]/50 flex items-center justify-center transition-all duration-300 hover:border-[#4a4a4a] hover:bg-[#111]/60">
            <div className="text-center">
              <div className="text-[#666] text-lg font-medium mb-1">Advertisement Space</div>
              <div className="text-[#888] text-sm">banner ads will appear here</div>
            </div>
          </div>
        </div>

        {/* commented temporarily */}

        {video.contentType === 'image' && (
          <div className="w-full overflow-hidden mb-4">
            <div className="w-full h-full relative flex flex-col lg:flex-row">
              {video.imageUrls && video.imageUrls.length > 0 ? (
                <>
                  <div className="flex-1 px-2 relative w-full h-auto lg:h-full">
                    <Image
                      src={config.stream + video.imageUrls[currentImageIndex]}
                      alt={`${video.title} - Image ${currentImageIndex + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-auto lg:h-full lg:max-h-[35rem] object-contain lg:object-contain"
                      priority
                    />

                    {video.imageUrls.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-roboto font-medium z-10">
                        {currentImageIndex + 1} / {video.imageUrls.length}
                      </div>
                    )}
                  </div>

                  {video.imageUrls.length > 1 && (
                    <div className="lg:w-[24rem] w-full">
                      <div className="bg-[#0a0a0a] rounded-lg p-3 lg:p-4 h-auto">
                        {/* Thumbnail Grid - Responsive */}
                        <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3 lg:mb-4">
                          {getCurrentPageThumbnails(video.imageUrls).map((imageUrl, index) => {
                            const actualIndex = currentThumbnailPage * getThumbnailsPerPage() + index;
                            return (
                              <button
                                key={actualIndex}
                                onClick={() => setCurrentImageIndex(actualIndex)}
                                className={`relative aspect-[4/3] cursor-pointer lg:aspect-[4/3] overflow-hidden border-2 transition-all duration-200 group ${
                                  currentImageIndex === actualIndex
                                    ? 'border-[#d6d203a3]'
                                    : 'border-none'
                                }`}
                              >
                                <Image
                                  src={config.stream + imageUrl}
                                  alt={`Thumbnail ${actualIndex + 1}`}
                                  fill
                                  className="object-cover group-hover:brightness-105 brightness-95 transition-all duration-200"
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Pagination Controls - Responsive */}
                        {getTotalPages(video.imageUrls) > 1 && (
                          <div className="flex items-center justify-between mb-2 lg:mb-0">
                            <button
                              onClick={handlePreviousPage}
                              disabled={currentThumbnailPage === 0}
                              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                                currentThumbnailPage === 0
                                  ? 'text-[#f0f0f0a0] font-pop cursor-not-allowed border bg-[#ffffff0e] border-[#acacac]'
                                  : 'text-[#eeeeee] font-pop cursor-pointer active:scale-[1.015] border bg-[#ffffff0e] border-[#d3d3d3]'
                              }`}
                            >
                              <i className="ri-arrow-left-s-line font-medium text-sm lg:text-base"></i>
                              Prev
                            </button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: getTotalPages(video.imageUrls) }, (_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentThumbnailPage(i)}
                                  className={`w-1.5 h-1.5 lg:w-1.5 lg:h-1.5 rounded-full transition-all ${
                                    i === currentThumbnailPage
                                      ? 'bg-[#d6d203]'
                                      : 'bg-[#7a7a7a]'
                                  }`}
                                />
                              ))}
                            </div>

                            <button
                              onClick={handleNextPage}
                              disabled={currentThumbnailPage === getTotalPages(video.imageUrls) - 1}
                              className={`flex items-center gap-1 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                                currentThumbnailPage === getTotalPages(video.imageUrls) - 1
                                  ? 'text-[#f0f0f0a0] font-pop cursor-not-allowed border bg-[#ffffff0e] border-[#acacac]'
                                  : 'text-[#eeeeee] font-pop cursor-pointer active:scale-[1.015] border bg-[#ffffff0e] border-[#d3d3d3]'
                              }`}
                            >
                              Next
                              <i className="ri-arrow-right-s-line text-sm lg:text-base"></i>
                            </button>
                          </div>
                        )}

                        <div className="text-center font-pop mt-2 lg:mt-3 text-white text-xs lg:text-sm">
                          Showing {currentThumbnailPage * getThumbnailsPerPage() + 1}-{Math.min((currentThumbnailPage + 1) * getThumbnailsPerPage(), video.imageUrls.length)} images of {video.imageUrls.length}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <p>No images available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {video.contentType !== 'image' && (
          <div
            ref={streamContainerRef}
            className="w-full relative bg-black rounded-lg overflow-hidden mb-4 aspect-video"
          >
            {isLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black"
                id="video-loading-overlay"
              >
                {video.thumbnail && (
                  <img
                    src={config.stream + video.thumbnail}
                    alt="Loading thumbnail"
                    className="absolute top-0 left-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="flex flex-col items-center z-10">
                  {loadingMessage == "Loading video..." && (
                    <div className="w-12 h-12 border-4 border-[#1a1a1a] border-t-[#d6d203] rounded-full animate-spin mb-3"></div>
                  )}
                  <p className="text-white text-base">{loadingMessage}</p>
                </div>
              </div>
            )}
            
            {memoizedVideoPlayer}
          </div>
        )}

        <div className="mb-4 bg-[#121212] rounded-lg p-4 md:p-6">
          <h1 className="text-[#ebebeb] font-roboto mb-1 md:mb-0 text-xl leading-tight md:leading-normal  md:text-2xl font-bold">
            {video.title}
          </h1>

          <div className="text-[#a0a0a0] md:text-sm text-xs flex items-center md:mb-2 mb-3">
            <span className="font-roboto">
              {formatCount(video.views || 0)} views
            </span>
            <span className="mx-2 opacity-70">|</span>
            <span className="font-roboto">
              {getRelativeTimeFromDate(video.createdAt || "")}
            </span>
          </div>

          <div className="md:hidden flex flex-wrap gap-[5px] mb-5">
            <button
              onClick={handleLike}
              className={`flex items-center justify-center gap-[0.4rem] px-3 py-[0.45rem] text-[#c0c0c0] border-[#3a3a3a] bg-[#1f1f1f] rounded-full ${
                isLiked
                  ? "border-[#d6d203] text-[#e8e830] bg-[#d6d20315]"
                  : "hover:border-[#525252]"
              } transition-all text-xs font-medium cursor-pointer`}
            >
              <i className="ri-thumb-up-fill text-[0.95rem]"></i>
              <span className="font-inter">
                {formatCount(likeCount)}
              </span>
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center justify-center gap-[0.4rem] px-3 py-[0.45rem] text-[#c0c0c0] border-[#3a3a3a] bg-[#1f1f1f] rounded-full ${
                isDisliked
                  ? "border-[#d6d203] text-[#e8e830] bg-[#d6d20315]"
                  : "hover:border-[#525252]"
              } transition-all text-xs font-medium cursor-pointer`}
            >
              <i className="ri-thumb-down-fill text-[0.95rem] translate-y-[1px]"></i>
              <span className="font-inter">
                {formatCount(dislikeCount)}
              </span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-[0.4rem] px-3 py-[0.45rem] rounded-full bg-[#1f1f1f] text-[#c0c0c0] transition-all text-xs font-medium cursor-pointer"
            >
              <FaShare size={13} />
              <span className="font-inter">Share</span>
            </button>

            <button 
              onClick={openReportModal}
              className="flex items-center justify-center gap-[0.4rem] px-3 py-[0.45rem] rounded-full bg-[#1f1f1f] text-[#c0c0c0] transition-all text-xs font-medium cursor-pointer"
            >
              <FaFlag size={11} />
              <span className="font-inter">Report</span>
            </button>

            {user?.isAdmin && (
              <button 
                onClick={handleDeleteContent}
                className="flex items-center justify-center gap-[0.4rem] px-3 py-[0.45rem] rounded-full bg-[#1f1f1f] text-[#c0c0c0] transition-all text-xs font-medium cursor-pointer"
              >
                <i className="ri-delete-bin-line text-xs" />
              </button>
            )}
          </div>

          <div className="hidden md:flex flex-wrap gap-y-5 mt-2 justify-between items-center">
            <div className="flex items-center gap-3 py-1">
              <div 
                className="relative w-9 h-9 md:w-10 md:h-10 bg-[#2d2d2d] rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleUploaderClick}
              >
                <Image
                  src={video.uploader?.avatar ? (config.stream + video.uploader.avatar) : (uploaderAvatarUrl || "/logo.webp")}
                  alt={video.uploader?.username || "User"}
                  width={40}
                  height={40}
                  className="rounded-full object-cover opacity-[97%]"
                />
              </div>
              <div className="cursor-pointer" onClick={handleUploaderClick}>
                <div className="text-[#e6e6e6] font-medium font-pop text-base tracking-wide hover:text-[#d6d203] transition-colors">
                  {video.uploader?.username || "Unknown User"}
                </div>
                <div className="text-[#a0a0a0] font-roboto text-xs">
                  {formatCount(subscriberCount || uploaderProfile?.subscriberCount || video.uploader?.subscriberCount || 0)} subscribers
                </div>
              </div>

              <div className="relative h-9 w-[0.8px] bg-[#323232]"></div>
              <button 
                onClick={isCurrentUserUploader ? undefined : handleSubscribe}
                               className={`flex items-center gap-1.5 ml-0.5 px-5 py-1.5 rounded-lg border text-sm transition-colors ${
                  isCurrentUserUploader
                    ? "border-[#525252] bg-[#2a2a2a] text-[#c0c0c0] cursor-default opacity-70"
                    : isSubscribed 
                      ? "border-[#525252] bg-[#2a2a2a] text-[#c0c0c0] cursor-pointer" 
                      : "border-[#999999] bg-[#1e1e1e] text-white hover:border-[#c2c2c2] hover:bg-[#242424] cursor-pointer"
                }`}
              >
                <FaBell className="text-sm" />
                <span className="font-inter">
                  {isCurrentUserUploader ? 'Your Content' : (isSubscribed ? 'Subscribed' : 'Subscribe')}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleLike}
                className={`flex items-center border text-[#c0c0c0] border-[#3a3a3a] bg-[#1f1f1f] gap-2 px-3.5 py-2 rounded-lg ${
                  isLiked
                    ? "border-[#d6d203b5] text-[#e8e830b5] bg-[#d6d20315]"
                    : "hover:border-[#525252]"
                } transition-all text-sm font-medium cursor-pointer`}
              >
                <FaThumbsUp size={14} />
                <span className="font-inter">
                  {formatCount(likeCount)}
                </span>
              </button>

             
              <button
               
                onClick={handleDislike}
                className={`flex items-center border text-[#c0c0c0] border-[#3a3a3a] bg-[#1f1f1f] gap-2 px-3.5 py-2 rounded-lg ${
                  isDisliked
                    ? "border-[#d6d203b5] text-[#e8e830b5] bg-[#d6d20315]"
                    : "hover:border-[#525252]"
                } transition-all text-sm font-medium cursor-pointer`}
              >
                               <FaThumbsDown size={14} />
                <span className="font-inter">
                  {formatCount(dislikeCount)}
                </span>
              </button>

              <button onClick={handleShare} className="flex items-center border border-[#3a3a3a] bg-[#1f1f1f] gap-2 px-3.5 py-2 rounded-lg text-[#c0c0c0] hover:border-[#525252] transition-all text-sm font-medium cursor-pointer">
                <FaShare size={14} />
                <span className="font-inter">Share</span>
              </button>

              <button onClick={openReportModal} className="flex items-center border border-[#3a3a3a] bg-[#1f1f1f] gap-2 px-3.5 py-2 rounded-lg text-[#c0c0c0] hover:border-[#525252] transition-all text-sm font-medium cursor-pointer">
                <FaFlag size={13} />
                <span className="font-inter">Report</span>
              </button>

              {user?.isAdmin && (
                <button
                  onClick={handleDeleteContent}
                  className="flex items-center border border-[#3a3a3a] bg-[#1f1f1f] gap-2 px-3.5 py-2 rounded-lg text-[#c0c0c0] hover:border-[#525252] transition-all text-sm font-medium cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-3 bg-[#1a1a1a] p-3 rounded-lg mb-5">
            <div 
              className="relative w-10 h-10 bg-[#252525] rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleUploaderClick}
            >
              <Image
                src={video.uploader?.avatar ? (config.stream + video.uploader.avatar) : (uploaderAvatarUrl || "/logo.webp")}
                alt={video.uploader?.username || "User"}
                width={40}
                height={40}
                className="rounded-full object-cover opacity-[97%]"
              />
            </div>
            <div className="flex-1 cursor-pointer" onClick={handleUploaderClick}>
              <div className="text-white font-medium font-inter text-sm hover:text-[#d6d203] transition-colors">
                {video.uploader?.username || "Unknown User"}
              </div>
              <div className="text-[#a0a0a0] font-roboto text-xs">
                {formatCount(subscriberCount || uploaderProfile?.subscriberCount || video.uploader?.subscriberCount || 0)} subscribers
              </div>
            </div>
            <button 
              onClick={isCurrentUserUploader ? undefined : handleSubscribe}
              className={`flex items-center gap-1.5 px-4 py-[6.8px] rounded-full border text-sm transition-colors ${
                isCurrentUserUploader
                  ? "border-[#525252] bg-[#2a2a2a] text-[#c0c0c0] cursor-default opacity-70"
                  : isSubscribed 
                    ? "border-[#525252] bg-[#2a2a2a] text-[#c0c0c0] cursor-pointer" 
                    : "border-[#999999] bg-[#1e1e1e] text-white hover:border-[#c2c2c2] hover:bg-[#242424] cursor-pointer"
              }`}
            >
              <FaBell className="text-sm" />
              <span className="font-inter">
                {isCurrentUserUploader ? 'Your Content' : (isSubscribed ? 'Subscribed' : 'Subscribe')}
              </span>
            </button>
          </div>

          {(video.description || (video.tags && video.tags.length > 0)) && (
            <div className="mt-5 pt-5 border-t border-[#2a2a2a]">
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {video.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#1a1a1a] text-[#d6d203db] text-xs px-2 py-0.5 rounded-full hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {video.description && (
                <p className="text-[#d0d0d0] text-sm md:text-base whitespace-pre-line leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="w-full px-4 lg:px-0 mb-5">
          <div className="w-full h-28 border-2 border-dashed border-[#3a3a3a] rounded-xl bg-[#0f0f0f]/50 flex items-center justify-center transition-all duration-300 hover:border-[#4a4a4a] hover:bg-[#111]/60">
            <div className="text-center">
              <div className="text-[#666] text-lg font-medium mb-1">Advertisement Space</div>
              <div className="text-[#888] text-sm">banner ads will appear here</div>
            </div>
          </div>
        </div>

        {/* commented temporarily */}

        <div className="px-4 lg:px-0">
          {video?.contentType === 'video' && (
            <>
              <div className="mb-4 border-b border-[#2a2a2a]">
                <div className="flex gap-1 md:gap-4">
                  <button
                    onClick={() => setActiveTab("related")}
                    className={`px-4 py-2 cursor-pointer transition-colors duration-300 ease-in flex items-center gap-2 ${
                      activeTab === "related"
                        ? "text-[#d6d203df] border-b-2 border-[#d6d203df]"
                        : "text-[#b0b0b0]"
                    }`}
                  >
                    <FaList className="" />
                    <span>Related Videos</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("recommended")}
                    className={`px-4 py-2 cursor-pointer transition-colors duration-300 ease-in flex items-center gap-2 ${
                      activeTab === "recommended"
                        ? "text-[#d6d203df] border-b-2 border-[#d6d203df]"
                        : "text-[#b0b0b0]"
                    }`}
                  >
                    <FaFireAlt className="" />
                    <span>Recommended</span>
                  </button>
                  <button
                    onClick={scrollToComments}
                    className={`px-4 hidden py-2 cursor-pointer transition-colors duration-300 ease-in md:flex items-center text-[#b0b0b0] gap-2`}
                  >
                    <FaCommentAlt className="hidden md:block" />
                    <span>Comments ({video.comments?.length || 0})</span>
                  </button>
                </div>
              </div>

              <div className="mb-8 relative overflow-hidden">
                <div 
                  className={`transition-all duration-500 ease-in-out ${
                    activeTab === "related" 
                      ? "transform translate-x-0 opacity-100" 
                      : "transform -translate-x-full opacity-0 absolute top-0 left-0 w-full"
                  }`}
                >
                  {renderRelatedContent()}
                </div>
                
                <div 
                  className={`transition-all duration-500 ease-in-out ${
                    activeTab === "recommended" 
                      ? "transform translate-x-0 opacity-100" 
                      : "transform translate-x-full opacity-0 absolute top-0 left-0 w-full"
                  }`}
                >
                  {renderRecommendedContent()}
                </div>
              </div>
            </>
          )}

          <div ref={commentsRef} className="mt-8">
            <div className="flex items-center justify-between mb-6 px-1 lg:px-0">
              <h3 className="text-white text-lg font-roboto font-medium">
                Comments ({totalComments.toLocaleString()})
              </h3>

              <div className="flex items-center gap-2">
                <select 
                  value={commentSort}
                  onChange={(e) => handleSortChange(e.target.value as 'recent' | 'popular' | 'oldest')}
                  className="bg-[#1a1a1a] text-[#d0d0d0] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#d6d203] transition-all duration-200 hover:border-[#4a4a4a]"
                >
                  <option value="recent">Newest first</option>
                  <option value="popular">Most liked</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            <div className="mb-8 flex gap-3 px-1 lg:px-0">
              <div className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-[#2a2a2a] ring-1 ring-[#3a3a3a]">
                <Image
                  src={user ? (user.avatar ? (config.stream + user.avatar) : userAvatarUrl || "/logo.webp") : "/logo.webp"}
                  alt={user?.username || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-grow">
                <div className="relative">
                  <textarea
                    ref={(el) => {
                      if (el && !newComment.trim()) {
                        el.style.height = 'auto';
                        el.style.height = '40px';
                      }
                    }}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (user && newComment.trim() && !isPostingComment) {
                          handlePostComment();
                          setTimeout(() => {
                            const textarea = e.target as HTMLTextAreaElement;
                            if (textarea) {
                              textarea.style.height = '40px';
                            }
                          }, 100);
                        }
                      }
                    }}
                    placeholder={user ? "Add a comment..." : "Sign in to comment"}
                    disabled={!user}
                    className="w-full bg-transparent border-b-2 border-[#3a3a3a] text-[#e0e0e0] py-3 px-1 focus:outline-none focus:border-[#d6d203] resize-none transition-all duration-200 placeholder-[#888] disabled:opacity-50 min-h-[48px] hover:border-[#4a4a4a]"
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.max(40, target.scrollHeight) + 'px';
                    }}
                  />
                  {newComment.trim() && (
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setNewComment('');
                          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            textarea.style.height = '50px';
                          }
                        }}
                        className="px-4 py-2 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handlePostComment();
                          setTimeout(() => {
                            const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                            if (textarea) {
                              textarea.style.height = '40px';
                            }
                          }, 100);
                        }}
                        disabled={isPostingComment || !newComment.trim()}
                        className="px-5 py-2 bg-[#d6d203] hover:bg-[#c9be03] disabled:bg-[#666] disabled:cursor-not-allowed text-[#202020] rounded-full transition-all duration-200 text-sm font-medium cursor-pointer"
                      >
                        {isPostingComment ? (
                          <i className="ri-loader-4-line animate-spin"></i>
                        ) : (
                          'Comment'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 px-1 lg:px-0">
              {commentsLoading && comments.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-2.5 bg-[#111]/30 rounded-lg p-3 border border-[#2a2a2a]/40">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-full"></div>
                    <div className="flex-grow space-y-2">
                      <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
                      <div className="h-3 bg-[#2a2a2a] rounded w-full"></div>
                      <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
                      <div className="flex gap-3 mt-2">
                        <div className="h-3 bg-[#2a2a2a] rounded w-8"></div>
                        <div className="h-3 bg-[#2a2a2a] rounded w-8"></div>
                        <div className="h-3 bg-[#2a2a2a] rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="group">
                    <div className="flex gap-2.5 bg-[#0f0f0f]/50 rounded-lg p-3 border border-[#2a2a2a]/30 hover:border-[#3a3a3a]/50 transition-all duration-300 hover:bg-[#111]/40">
                      <div 
                        className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#2a2a2a] ring-1 ring-[#3a3a3a]/50 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleCommentUserClick(comment.username)}
                      >
                        <Image
                          src={comment.avatar ? (config.stream + comment.avatar) : `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${encodeURIComponent(comment.avatarColor || '#000000')}"/><text x="50" y="50" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="40" fill="white">${comment.username?.[0]?.toUpperCase() || '?'}</text></svg>`}
                          alt={comment.username}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        {/* Comment Header */}
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="text-[#f5f5f5] font-semibold text-sm font-roboto truncate cursor-pointer hover:text-[#d6d203] transition-colors"
                            onClick={() => handleCommentUserClick(comment.username)}
                          >
                            {comment.username}
                          </span>
                          <span className="text-[#999] text-xs flex-shrink-0">
                            {getRelativeTimeFromDate(comment.createdAt)}
                          </span>
                          {(user?._id === comment.user || user?.isAdmin) && (
                            <button
                              onClick={() => handleCommentAction('delete', comment._id)}
                              className="md:opacity-0 group-hover:opacity-100 text-[#ff4444] hover:text-[#ff6666] hover:bg-[#ff4444]/10 text-xs transition-all duration-200 ml-auto p-1 rounded flex-shrink-0"
                              title="Delete comment"
                            >
                              <i className="ri-delete-bin-line text-xs"></i>
                            </button>
                          )}
                        </div>

                        <p className="text-[#e0e0e0] text-sm mb-2 whitespace-pre-wrap break-words leading-relaxed">
                          {comment.content}
                        </p>

                        <div className="flex items-center gap-[0.01rem]">
                          <button
                            onClick={() => handleCommentAction('like', comment._id)}
                            className={`flex items-center gap-1 text-xs transition-all duration-200 px-2 py-1 rounded font-medium cursor-pointer ${
                              comment.isLiked 
                                ? 'text-[#d6d203] bg-[#d6d203]/10' 
                                : 'text-[#999] hover:text-[#d6d203] hover:bg-[#d6d203]/5'
                            }`}
                          >
                            <i className={`ri-thumb-up-${comment.isLiked ? 'fill' : 'line'} text-xs`}></i>
                            <span>{comment.likeCount || 0}</span>
                          </button>
                          
                          <button
                            onClick={() => handleCommentAction('dislike', comment._id)}
                            className={`flex items-center gap-1 text-xs transition-all duration-200 px-2 py-1 rounded font-medium cursor-pointer ${
                              comment.isDisliked 
                                ? 'text-[#d6d203] bg-[#d6d203]/10' 
                                : 'text-[#999] hover:text-[#d6d203] hover:bg-[#d6d203]/5'
                            }`}
                          >
                            <i className={`ri-thumb-down-${comment.isDisliked ? 'fill' : 'line'} text-xs`}></i>
                            <span>{comment.dislikeCount || 0}</span>
                          </button>
                          
                          {user && (
                            <button
                              onClick={() => setShowReplyBox(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                              className="text-[#999] hover:text-[#d6d203] hover:bg-[#d6d203]/5 text-xs transition-all duration-200 font-medium px-2 py-1 rounded cursor-pointer"
                            >
                              <i className="ri-reply-line text-xs"></i>
                              <span className=" ml-1">Reply</span>
                            </button>
                          )}
                          
                          {comment.replyCount > 0 && (
                            <button
                              onClick={() => toggleReplies(comment._id)}
                              className="text-[#d6d203] hover:bg-[#d6d203]/5 text-xs transition-all duration-200 font-medium flex items-center gap-1 px-1.5 py-1 rounded ml-1 cursor-pointer"
                            >
                              <i className={`ri-arrow-${expandedReplies.has(comment._id) ? 'up' : 'down'}-s-line transition-transform duration-200 text-xs`}></i>
                              <span className="">{expandedReplies.has(comment._id) ? 'Hide' : 'Show'} {comment.replyCount}</span>
                              {/* <span className="sm:hidden">{comment.replyCount}</span> */}
                            </button>
                          )}
                        </div>

                        {showReplyBox[comment._id] && (
                          <div className="mt-3 flex gap-2 bg-[#0a0a0a]/40 rounded-lg p-2.5 border border-[#2a2a2a]/40 animate-in slide-in-from-top-2 duration-200">
                            <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-[#2a2a2a] ring-1 ring-[#3a3a3a]">
                              <Image
                                src={user ? (config.stream + user.avatar || userAvatarUrl || "/logo.webp") : "/logo.webp"}
                                alt={user?.username || "User"}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-grow">
                              <textarea
                                value={replyText[comment._id] || ''}
                                onChange={(e) => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (user && replyText[comment._id]?.trim() && !isPostingReply[comment._id]) {
                                      handlePostReply(comment._id);
                                    }
                                  }
                                }}
                                placeholder="Add a reply..."
                                className="w-full bg-[#1a1a1a] border border-[#3a3a3a] text-[#e0e0e0] rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#d6d203] focus:ring-1 focus:ring-[#d6d203]/30 resize-none transition-all duration-200 hover:border-[#4a4a4a]"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setShowReplyBox(prev => ({ ...prev, [comment._id]: false }));
                                    setReplyText(prev => ({ ...prev, [comment._id]: '' }));
                                  }}
                                  className="px-2.5 py-1 text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a]/30 transition-all duration-200 text-sm rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handlePostReply(comment._id)}
                                  disabled={ isPostingReply[comment._id] || !replyText[comment._id]?.trim()}
                                  className="px-3 py-1 bg-[#d6d203] hover:bg-[#c9be03] disabled:bg-[#666] disabled:cursor-not-allowed text-[#202020] rounded transition-all duration-200 text-sm font-medium cursor-pointer"
                                >
                                  {isPostingReply[comment._id] ? (
                                    <i className="ri-loader-4-line animate-spin"></i>
                                  ) : (
                                    'Reply'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {expandedReplies.has(comment._id) && comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-[#d6d203]/30 space-y-2 animate-in slide-in-from-top-2 duration-300">
                            {comment.replies.map((reply) => (
                              <div key={reply._id} className="flex gap-2 group/reply bg-[#0a0a0a]/30 rounded-lg p-2.5 border border-[#2a2a2a]/20 hover:border-[#3a3a3a]/40 transition-all duration-200 hover:bg-[#111]/40">
                                <div 
                                  className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-[#2a2a2a] ring-1 ring-[#3a3a3a]/40 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleCommentUserClick(reply.username)}
                                >
                                  <Image
                                    src={reply.avatar ? (config.stream + reply.avatar) : `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${encodeURIComponent(reply.avatarColor || '#000000')}"/><text x="50" y="50" text-anchor="middle" dy="0.35em" font-family="Arial" font-size="40" fill="white">${reply.username?.[0]?.toUpperCase() || '?'}</text></svg>`}
                                    alt={reply.username}
                                    width={24}
                                    height={24}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span 
                                      className="text-[#f5f5f5] whitespace-nowrap font-semibold text-sm truncate cursor-pointer hover:text-[#d6d203] transition-colors"
                                      onClick={() => handleCommentUserClick(reply.username)}
                                    >
                                      {reply.username}
                                    </span>
                                    <span className="text-[#999] whitespace-nowrap text-xs flex-shrink-0">
                                      {getRelativeTimeFromDate(reply.createdAt)}
                                    </span>
                                    {(user?._id === reply.user || user?.isAdmin) && (
                                      <button
                                        onClick={() => handleCommentAction('delete', comment._id, reply._id)}
                                        className="md:opacity-0 group-hover/reply:opacity-100 text-[#ff4444] hover:text-[#ff6666] hover:bg-[#ff4444]/10 text-xs transition-all duration-200 ml-auto p-1 rounded flex-shrink-0"
                                        title="Delete reply"
                                      >
                                        <i className="ri-delete-bin-line text-xs"></i>
                                      </button>
                                    )}
                                  </div>
                                  
                                  <p className="text-[#e0e0e0] text-sm mb-2 whitespace-pre-wrap break-words leading-relaxed">
                                    {reply.content}
                                  </p>
                                  
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={() => handleCommentAction('like', comment._id, reply._id)}
                                      className={`flex items-center gap-1 text-xs transition-all duration-200 px-2 py-0.5 rounded font-medium cursor-pointer ${
                                        reply.isLiked 
                                          ? 'text-[#d6d203] bg-[#d6d203]/10' 
                                          : 'text-[#999] hover:text-[#d6d203] hover:bg-[#d6d203]/5'
                                      }`}
                                    >
                                      <i className={`ri-thumb-up-${reply.isLiked ? 'fill' : 'line'} text-xs`}></i>
                                      <span>{reply.likeCount || 0}</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => handleCommentAction('dislike', comment._id, reply._id)}
                                      className={`flex items-center gap-1 text-xs transition-all duration-200 px-2 py-0.5 rounded font-medium cursor-pointer ${
                                        reply.isDisliked 
                                          ? 'text-[#d6d203] bg-[#d6d203]/10' 
                                          : 'text-[#999] hover:text-[#d6d203] hover:bg-[#d6d203]/5'
                                      }`}
                                    >
                                      <i className={`ri-thumb-down-${reply.isDisliked ? 'fill' : 'line'} text-xs`}></i>
                                      <span>{reply.dislikeCount || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {hasMoreComments && (
              <div className="flex justify-center mt-8 px-4 lg:px-0">
                <button
                  onClick={loadMoreComments}
                  disabled={commentsLoading}
                  className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#d0d0d0] rounded-xl transition-all duration-200 font-medium border border-[#3a3a3a] hover:border-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  {commentsLoading ? (
                    <div className="flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      Loading...
                    </div>
                  ) : (
                    `Load more comments`
                  )}
                </button>
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <div className="text-center py-16 px-4 lg:px-0">
                <div className="bg-[#111]/40 rounded-2xl p-8 border border-[#2a2a2a]/40 max-w-md mx-auto">
                  {/* <div className="text-5xl mb-4 opacity-60">💬</div> */}
                  <h4 className="text-[#e0e0e0] text-lg font-semibold mb-2">No comments yet</h4>
                  <p className="text-[#999] text-sm">
                    {user ? "Be the first to share what you think!" : "Sign in to start the conversation!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>    
    </div>      
  );
};

const WatchPage = () => {
  return (
    <Suspense fallback={<WatchPageLoading />}>
      <WatchPageContent />
    </Suspense>
  );
};

export default WatchPage;
