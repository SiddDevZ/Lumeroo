'use client'
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { FiFilter, FiSearch } from 'react-icons/fi';
import config from '@/config.json';
import { FaPlay, FaImage } from 'react-icons/fa';

const SearchContent = () => {
  const [user, setUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterJustOpened, setFilterJustOpened] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    contentType: 'all', // 'all', 'videos', 'images'
    sortBy: 'relevance', // 'relevance', 'recent', 'views', 'hot'
    dateRange: 'all', // 'all', 'today', 'week', 'month', 'year'
  });

  const searchParams = useSearchParams();
  const resultsPerPage = 20;

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query, 1, filters);
    }
  }, [searchParams]);

  const handleSearch = async (query, page = 1, currentFilters = filters) => {
    if (!query || !query.trim()) return;
    
    setIsLoading(true);
    setCurrentPage(page);
    
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        page: page.toString(),
        limit: resultsPerPage.toString(),
        type: currentFilters.contentType,
        sort: currentFilters.sortBy
      });

      if (currentFilters.dateRange !== 'all') {
        const now = new Date();
        let dateFrom;
        
        switch (currentFilters.dateRange) {
          case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            dateFrom = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        if (dateFrom) {
          params.append('dateFrom', dateFrom.toISOString());
        }
      }

      const response = await fetch(`${config.url}/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalResults(data.pagination?.totalResults || 0);
      } else {
        console.error('Search failed:', data.message);
        setSearchResults([]);
        setTotalPages(1);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else {
      return count.toString();
    }
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateLikePercentage = (likeCount = 0, dislikeCount = 0) => {
    if (likeCount === 0 && dislikeCount === 0) return 0;
    return Math.round((likeCount / (likeCount + dislikeCount)) * 100);
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setFilterJustOpened(false);
    if (searchQuery) {
      handleSearch(searchQuery, 1, newFilters);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(searchQuery, page, filters);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="aspect-video bg-[#1a1a1a] rounded-lg mb-3">
        <div className="w-full h-full bg-[#252525] rounded-lg"></div>
      </div>
      <div className="flex gap-3">
        <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-[#1a1a1a] rounded w-full mb-2"></div>
          <div className="h-3 bg-[#1a1a1a] rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );

  const SearchResultCard = ({ result }) => {
    const likePercentage = calculateLikePercentage(result.likeCount, result.dislikeCount);
    const isVideo = result.type === 'video';
    const linkPath = isVideo ? `/watch?v=${result.slug}` : `/watch?v=${result.slug}`;
    
    return (
      <div className="group">
        <Link href={linkPath} className="block">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-[#101010]">
            <Image
              src={config.stream + result.thumbnail}
              alt={result.title}
              width={320}
              height={180}
              className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-[#00000059] opacity-95"></div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              {isVideo ? <FaPlay size={8} /> : <FaImage size={8} />}
              {isVideo ? formatDuration(result.duration) : 'Image'}
            </div>
          </div>
        </Link>

        <div className="flex mt-3 gap-3">
          <Link href={`/profile?user=${result.uploader.username}`} className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1f1f1f] hover:opacity-80 transition-opacity">
              {result.uploader.avatar ? (
                <Image
                  src={config.stream + result.uploader.avatar}
                  alt={result.uploader.username}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-medium text-lg"
                  style={{ backgroundColor: result.uploader.avatarColor || '#1f1f1f' }}
                >
                  {result.uploader.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={linkPath} className="block group">
              <h3 className="font-medium text-white text-sm font-inter leading-5 group-hover:text-[#b8b002] transition-colors duration-200 line-clamp-2">
                {result.title}
              </h3>
            </Link>

            <div className="mt-1">
              <div className="flex items-center font-pop flex-wrap gap-1.5 text-xs">
                <Link href={`/profile?user=${result.uploader.username}`} className="text-[#aaa] hover:text-[#b8b002] transition-colors duration-200">
                  {result.uploader.username}
                </Link>
                <span className="text-[#666]">•</span>
                <span className="text-[#aaa]">{formatCount(result.views)} views</span>
                <span className="text-[#666]">•</span>
                <span className="text-[#b8b002]">{likePercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <NavBar 
        user={user} 
        setUser={setUser} 
        showCategories={false}
      />
      
      <div className="max-w-[79rem] mx-auto px-4 lg:px-2 pt-6 pb-8">
        {searchQuery && (
          <div className="mb-8">
            <div className="flex items-center md:text-base text-sm justify-between mb-6">
              <div className="text-[#aaa]">
                {isLoading ? (
                  <span>Searching for <span className="text-white font-medium">"{searchQuery}"</span>...</span>
                ) : searchResults.length > 0 ? (
                  <span>
                    Showing {totalResults} results for <span className="text-white font-medium">"{searchQuery}"</span>
                  </span>
                ) : (
                  <span>No results found for <span className="text-white font-medium">"{searchQuery}"</span></span>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (!showFilters) {
                    setFilterJustOpened(true);
                  }
                  setShowFilters(!showFilters);
                }}
                className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'border-[#b8b002] bg-[#b8b002]/10 text-[#b8b002]' 
                    : 'border-[#3a3a3a] bg-[#1a1a1a] text-[#ccc] hover:border-[#b8b002bb] hover:bg-[#b8b002]/10 hover:text-[#b8b002f1]'
                }`}
              >
                <FiFilter size={16} />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className={`overflow-hidden font-roboto transition-all duration-500 ease-out ${filterJustOpened ? 'animate-slideDown' : ''}`}>
                <div className="bg-[#0d0d0dae] border border-[#2a2a2a]/50 rounded-xl p-4 md:p-6 mb-0 relative">
                  <div className="relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="block text-[0.76rem] md:text-[0.84rem] text-[#e0e0e0] mb-1 md:mb-1">Type</label>
                        <div className="relative">
                          <select
                            value={filters.contentType}
                            onChange={(e) => handleFilterChange('contentType', e.target.value)}
                            className="w-full bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#3a3a3a]/70 rounded-lg px-3 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-[#b8b002] focus:ring-1 focus:ring-[#b8b002]/30 transition-all duration-200 hover:border-[#b8b002]/60 appearance-none cursor-pointer"
                          >
                            <option value="all" className="bg-[#1a1a1a] text-white">All Content</option>
                            <option value="videos" className="bg-[#1a1a1a] text-white">Videos</option>
                            <option value="images" className="bg-[#1a1a1a] text-white">Images</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[0.76rem] md:text-[0.84rem] text-[#e0e0e0] mb-1 md:mb-1">Sort</label>
                        <div className="relative">
                          <select
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="w-full bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#3a3a3a]/70 rounded-lg px-3 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-[#b8b002] focus:ring-1 focus:ring-[#b8b002]/30 transition-all duration-200 hover:border-[#b8b002]/60 appearance-none cursor-pointer"
                          >
                            <option value="relevance" className="bg-[#1a1a1a] text-white">Relevance</option>
                            <option value="recent" className="bg-[#1a1a1a] text-white">Recent</option>
                            <option value="views" className="bg-[#1a1a1a] text-white">Views</option>
                            <option value="hot" className="bg-[#1a1a1a] text-white">Hot</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[0.76rem] md:text-[0.84rem] text-[#e0e0e0] mb-1 md:mb-1">Date</label>
                        <div className="relative">
                          <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            className="w-full bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#3a3a3a]/70 rounded-lg px-3 py-2 md:py-2.5 text-sm text-white focus:outline-none focus:border-[#b8b002] focus:ring-1 focus:ring-[#b8b002]/30 transition-all duration-200 hover:border-[#b8b002]/60 appearance-none cursor-pointer"
                          >
                            <option value="all" className="bg-[#1a1a1a] text-white">Any Time</option>
                            <option value="today" className="bg-[#1a1a1a] text-white">Today</option>
                            <option value="week" className="bg-[#1a1a1a] text-white">This Week</option>
                            <option value="month" className="bg-[#1a1a1a] text-white">This Month</option>
                            <option value="year" className="bg-[#1a1a1a] text-white">This Year</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[0.76rem] md:text-[0.84rem] text-[#e0e0e0] mb-1 md:mb-1">Reset</label>
                        <button
                          onClick={() => {
                            const resetFilters = {
                              contentType: 'all',
                              sortBy: 'relevance',
                              dateRange: 'all',
                            };
                            setFilters(resetFilters);
                            if (searchQuery) {
                              handleSearch(searchQuery, 1, resetFilters);
                            }
                          }}
                          className="w-full bg-[#b8b002]/20 hover:bg-[#b8b002]/30 border border-[#b8b002]/50 hover:border-[#b8b002] rounded-lg px-3 py-2 md:py-2.5 text-sm text-[#b8b002] hover:text-white transition-all duration-200"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 12 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {searchResults.map((result) => (
                <SearchResultCard key={result._id} result={result} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 1 
                      ? 'bg-[#1a1a1a] text-[#666] cursor-not-allowed' 
                      : 'bg-[#1a1a1a] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === pageNum 
                            ? 'bg-[#b8b002] text-[#202020]' 
                            : 'bg-[#1a1a1a] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages 
                      ? 'bg-[#1a1a1a] text-[#666] cursor-not-allowed' 
                      : 'bg-[#1a1a1a] text-[#ccc] hover:bg-[#2a2a2a] hover:text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : searchQuery && !isLoading ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <FiSearch className="mx-auto text-[#666] mb-4" size={64} />
              <h2 className="text-2xl font-semibold text-white mb-2">No results found</h2>
              <p className="text-[#aaa] max-w-md mx-auto">
                We couldn't find any results for "{searchQuery}". Try adjusting your search terms or filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <FiSearch className="mx-auto text-[#666] mb-4" size={64} />
            <h2 className="text-2xl font-semibold text-white mb-2">Search Lumeroo</h2>
            <p className="text-[#aaa] max-w-md mx-auto">
              Discover amazing videos and images from the community. Use the search bar in the navigation to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] text-white">
        <div className="max-w-[79rem] mx-auto px-4 lg:px-2 pt-6 pb-8">
          <div className="mb-8">
            <div className="text-[#aaa] mb-6">
              <span>Loading search...</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-video bg-[#1a1a1a] rounded-lg mb-3">
                  <div className="w-full h-full bg-[#252525] rounded-lg"></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#1a1a1a] rounded w-full mb-2"></div>
                    <div className="h-3 bg-[#1a1a1a] rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
