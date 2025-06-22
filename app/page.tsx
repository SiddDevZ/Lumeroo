'use client'
import React, { useState, useEffect, Suspense } from "react";
import NavBar from "@/components/NavBar";
import VideoCard from "@/components/VideoGrid";
import ImageGrid from "@/components/ImageGrid";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import config from "../config.json"

function HomeContent() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("discover");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const [videoData, setVideoData] = useState<any[]>([]);
  const [imageData, setImageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [viewedVideoIds, setViewedVideoIds] = useState<Set<string>>(new Set());
  const [viewedImageIds, setViewedImageIds] = useState<Set<string>>(new Set());
  const [currentVideoPage, setCurrentVideoPage] = useState(1);
  const [currentImagePage, setCurrentImagePage] = useState(1);
  const [videoPagination, setVideoPagination] = useState<any>(null);
  const [imagePagination, setImagePagination] = useState<any>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== activeCategory) {
      setActiveCategory(categoryParam);
    } else if (!categoryParam && activeCategory !== 'discover') {
      setActiveCategory('discover');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeCategory === "images") {
      fetchDiscoverImages(1, []);
    } else {
      fetchVideosForCategory(activeCategory, 1, []);
    }
  }, [activeCategory]);

  useEffect(() => {
    setViewedVideoIds(new Set());
    setViewedImageIds(new Set());
    setCurrentVideoPage(1);
    setCurrentImagePage(1);
    setVideoPagination(null);
    setImagePagination(null);
  }, [activeCategory]);

  const fetchVideosForCategory = async (category: string, page: number = 1, excludeIds: string[] = []) => {
    try {
      if (category === 'subscriptions') {
        const token = localStorage.getItem('token');
        if (!token) {
          setVideoData([]);
          setVideoPagination(null);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }

      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const sortMapping: { [key: string]: string } = {
        discover: 'hot',
        top: 'top', 
        recent: 'recent',
        liked: 'top',
        random: 'random',
        subscriptions: 'subscriptions'
      };

      const sortParam = sortMapping[category] || 'hot';
      const url = new URL(`${config.url}/api/discover`);
      
      url.searchParams.append('limit', '20');
      url.searchParams.append('page', page.toString());
      url.searchParams.append('sort', sortParam);

      const allExcludeIds = page > 1 ? Array.from(viewedVideoIds) : excludeIds;
      if (allExcludeIds.length > 0) {
        url.searchParams.append('excludeIds', allExcludeIds.join(','));
      }

      if (category === 'subscriptions') {
        const token = localStorage.getItem('token');
        if (token) {
          url.searchParams.append('token', token);
        }
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        if (data.redirect && data.videoSlug) {
          router.push(`/watch?v=${data.videoSlug}`);
          return;
        }
        
        if (data.videos) {
          const newVideos = data.videos.filter((video: any) => !viewedVideoIds.has(video._id));
          
          if (page === 1) {
            setVideoData(newVideos);
            setViewedVideoIds(new Set(newVideos.map((video: any) => video._id)));
          } else {
            setVideoData(prev => [...prev, ...newVideos]);
            setViewedVideoIds(prev => {
              const newSet = new Set(prev);
              newVideos.forEach((video: any) => newSet.add(video._id));
              return newSet;
            });
          }
          setCurrentVideoPage(page);
          setVideoPagination(data.pagination || null);
        } else {
          if (page === 1) {
            setVideoData([]);
          }
        }
      } else {
        setError(data.message || 'Failed to fetch videos');
        if (page === 1) {
          setVideoData([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${category} videos:`, error);
      if (page === 1) {
        setVideoData([]);
      }
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const fetchDiscoverImages = async (page: number = 1, excludeIds: string[] = []) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const url = new URL(`${config.url}/api/discoverImages`);
      
      url.searchParams.append('limit', '20');
      url.searchParams.append('page', page.toString());

      const allExcludeIds = page > 1 ? Array.from(viewedImageIds) : excludeIds;
      if (allExcludeIds.length > 0) {
        url.searchParams.append('excludeIds', allExcludeIds.join(','));
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success && data.images) {
        const newImages = data.images.filter((image: any) => !viewedImageIds.has(image._id));
        
        if (page === 1) {
          setImageData(newImages);
          setViewedImageIds(new Set(newImages.map((image: any) => image._id)));
        } else {
          setImageData(prev => [...prev, ...newImages]);
          setViewedImageIds(prev => {
            const newSet = new Set(prev);
            newImages.forEach((image: any) => newSet.add(image._id));
            return newSet;
          });
        }
        setCurrentImagePage(page);
        setImagePagination(data.pagination || null);
      } else {
        setError(data.message || 'Failed to fetch images');
        if (page === 1) {
          setImageData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching discover images:', error);
      if (page === 1) {
        setImageData([]);
      }
    } finally {
      if (page === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };
  
  const loadMoreVideos = () => {
    if (videoPagination && videoPagination.hasNextPage && !loading && !loadingMore) {
      const nextPage = currentVideoPage + 1;
      fetchVideosForCategory(activeCategory, nextPage, []);
    }
  };

  const loadMoreImages = () => {
    if (imagePagination && imagePagination.hasNextPage && !loading && !loadingMore) {
      const nextPage = currentImagePage + 1;
      fetchDiscoverImages(nextPage, []);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    if (newCategory === activeCategory) return;
    
    setIsTransitioning(true);
    setLoading(true);
    setVideoData([]);
    setImageData([]);
    setError(null);
    
    setViewedVideoIds(new Set());
    setViewedImageIds(new Set());
    setCurrentVideoPage(1);
    setCurrentImagePage(1);
    setVideoPagination(null);
    setImagePagination(null);

    setTimeout(() => {
      setActiveCategory(newCategory);
      setContentKey(prev => prev + 1);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 25);
    }, 30);
  };

  const renderVideoSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: 20 }, (_, index) => (
        <div key={`skeleton-${index}`} className="">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-[#101010] animate-pulse">
            <div className="w-full h-full bg-[#1a1a1a]"></div>
          </div>

          <div className="flex mt-3 gap-3">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] animate-pulse"></div>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="space-y-1">
                <div className="h-4 bg-[#1a1a1a] rounded w-full animate-pulse"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-3/4 animate-pulse"></div>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-3 bg-[#1a1a1a] rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-[#1a1a1a] rounded w-12 animate-pulse"></div>
                <div className="h-3 bg-[#1a1a1a] rounded w-8 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderImageSkeletons = () => (
    <div className="flex gap-2.5 sm:gap-4">
      {Array.from({ length: typeof window !== 'undefined' ? (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2) : 4 }, (_, columnIndex) => (
        <div key={`skeleton-column-${columnIndex}`} className="flex-1 space-y-3 sm:space-y-4">
          {Array.from({ length: 3 }, (_, cardIndex) => (
            <div key={`skeleton-${columnIndex}-${cardIndex}`} className="break-inside-avoid">
              <div className="bg-[#1a1a1a] rounded-xl overflow-hidden animate-pulse">
                <div 
                  className="w-full bg-[#252525]"
                  style={{
                    height: `${200 + Math.random() * 100}px`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isTransitioning) {
      return <div className="w-full h-64"></div>;
    }

    const isCurrentlyLoading = loading;
    const currentData = activeCategory === "images" ? imageData : videoData;
    
    if (isCurrentlyLoading && currentData.length === 0) {
      return (
        <div className="w-full">
          {activeCategory === "images" ? renderImageSkeletons() : renderVideoSkeletons()}
        </div>
      );
    }
    
    if (error && currentData.length === 0 && !isCurrentlyLoading) {
      return (
        <div className="flex flex-col justify-center items-center py-16 text-center">
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button 
            onClick={() => activeCategory === "images" ? fetchDiscoverImages() : fetchVideosForCategory(activeCategory)}
            className="px-4 py-2 bg-[#d6d203d2] text-black rounded-lg hover:bg-[#c4c000] transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeCategory) {
      case "images":
        if (imageData.length === 0 && !isCurrentlyLoading && !error) {
          return (
            <div className="flex justify-center text-center items-center py-16 text-white/60">
              No images found
            </div>
          );
        }
        return (
          <>
            <ImageGrid videos={imageData} />
            {loadingMore && (
              <div className="mt-6">
                {renderImageSkeletons()}
              </div>
            )}
            {imagePagination && imagePagination.hasNextPage && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreImages}
                  disabled={loading || loadingMore}
                  className="px-5 py-2.5 bg-[#d6d203d2] hover:bg-[#c4c000] cursor-pointer text-black rounded-lg transition-colors duration-200 font-medium"
                >
                  {loadingMore ? 'Loading...' : 'Load More Images'}
                </button>
              </div>
            )}
          </>
        );
        
      case "discover":
      case "top":
      case "recent":
      case "liked":
      case "subscriptions":
        if (videoData.length === 0 && !isCurrentlyLoading && !error) {
          let emptyMessage = "No videos found";
          if (activeCategory === "subscriptions") {
            if(!user){
              emptyMessage = "Please log in to see videos from your subscriptions.";
            } else {
              emptyMessage = "No videos from your subscriptions. Subscribe to creators to see their content here!";
            }
          } else if (activeCategory === "liked") {
            emptyMessage = "No highly liked videos found";
          } else if (activeCategory === "recent") {
            emptyMessage = "No recent videos found";
          } else if (activeCategory === "top") {
            emptyMessage = "No top videos found";
          }
          
          return (
            <div className="flex justify-center text-center items-center py-16 text-white/60">
              {emptyMessage}
            </div>
          );
        }

        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {videoData.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
            {loadingMore && (
              <div className="mt-6">
                {renderVideoSkeletons()}
              </div>
            )}
            {videoPagination && videoPagination.hasNextPage && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreVideos}
                  disabled={loading || loadingMore}
                  className="px-5 py-2.5 bg-[#d6d203d2] hover:bg-[#c4c000] cursor-pointer text-black rounded-lg transition-colors duration-200 font-medium"
                >
                  {loadingMore ? 'Loading...' : 'Load More Videos'}
                </button>
              </div>
            )}
          </>
        );
        
      case "random":
        return (
          <div className="flex justify-center items-center py-16 text-white/60">
            Redirecting to random video...
          </div>
        );
        
      default:
        return (
          <div className="flex justify-center items-center py-16 text-white/60">
            Category not found
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-[#080808] min-h-screen w-full">
        <NavBar 
          user={user} 
          setUser={setUser} 
          showCategories={true}
          activeCategory={activeCategory}
          setActiveCategory={handleCategoryChange}
        />
        <div className="max-w-[79rem] mx-auto px-4 lg:px-2 pt-2 pb-8 relative overflow-hidden">
          <div
            key={contentKey}
            className={`transition-all duration-250 ease-in-out transform ${
              isTransitioning 
                ? 'opacity-0 translate-y-1 scale-[0.98]' 
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            {renderContent()}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="bg-[#080808] min-h-screen w-full">
        <div className="max-w-[79rem] mx-auto px-4 lg:px-2 pt-2 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 20 }, (_, index) => (
              <div key={`skeleton-${index}`} className="">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-[#101010] animate-pulse">
                  <div className="w-full h-full bg-[#1a1a1a]"></div>
                  
                  <div className="absolute bottom-2 right-2 bg-black/80 rounded">
                    <div className="h-4 w-8 bg-[#252525] rounded"></div>
                  </div>
                </div>

                <div className="flex mt-3 gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] animate-pulse"></div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="space-y-1">
                      <div className="h-4 bg-[#1a1a1a] rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 animate-pulse"></div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-3 bg-[#1a1a1a] rounded w-16 animate-pulse"></div>
                      <div className="h-3 bg-[#1a1a1a] rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-[#1a1a1a] rounded w-8 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
