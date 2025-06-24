"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FiSearch, FiMenu, FiX } from "react-icons/fi";
import { FaUserAlt, FaRegUser, FaRandom, FaHeart,  FaUser, FaClock, FaTrophy, FaCompass } from "react-icons/fa";
import { RiVideoUploadFill, RiVideoUploadLine } from "react-icons/ri";
import { IoSearchSharp } from "react-icons/io5";
import { FaRegImage } from "react-icons/fa6";
import AuthModel from './authModel';
import UploadModal from './UploadModal';
import Link from "next/link";
import { useRouter } from "next/navigation";
import config from "../config.json";
import useUserAvatar from '../hooks/useUserAvatar';

const NavBar = ({user, setUser, showCategories = true, activeCategory, setActiveCategory}: {
  user?: any; 
  setUser?: (user: any) => void; 
  showCategories?: boolean;
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [localActiveCategory, setLocalActiveCategory] = useState("discover");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { avatarUrl } = useUserAvatar(user) as { avatarUrl: string; isLoading: boolean };
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsAuthChecking(true);
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setIsAuthChecking(false);
          return;
        }

        const response = await fetch(`${config.url}/api/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success && data.user) {
          if (setUser) {
            setUser(data.user);
            console.log("User authenticated:", data.user);
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkAuthentication();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  const handleProfileNavigation = () => {
    if (isAuthChecking) return;
    
    if (user) {
      router.push("/profile");
    } else{
      setShowAuthModal(true);
    }
  };

  const handleUploadNavigation = () => {
    if (isAuthChecking) return;
    
    if (user) {
      setShowUploadModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const focusSearchInput = (isMobileView: boolean) => {
    if (isMobileView) {
      mobileSearchInputRef.current?.focus();
    } else {
      desktopSearchInputRef.current?.focus();
    }
  };

  const handleCategoryNavigation = (categoryId: string) => {
    if (categoryId === "discover") {
      router.push("/");
    } else {
      router.push(`/?category=${categoryId}`);
    }

    if (window.location.pathname === '/') {
      if (setActiveCategory) {
        setActiveCategory(categoryId);
      } else {
        setLocalActiveCategory(categoryId);
      }
    }
  };

  const categories = [
    { id: "discover", name: "Discover", icon: <FaCompass /> },
    { id: "images", name: "Images", icon: <FaRegImage /> },
    { id: "top", name: "Top Videos", icon: <FaTrophy /> },
    // { id: "popular", name: "Popular Now", icon: <FaFire /> },
    { id: "recent", name: "Recently Added", icon: <FaClock /> },
    { id: "liked", name: "Most Liked", icon: <FaHeart /> },
    { id: "random", name: "Random", icon: <FaRandom /> },
    { id: "subscriptions", name: "Subscriptions", icon: <FaUser /> },
  ];

  const currentActiveCategory = activeCategory || localActiveCategory;

  return (
    <div className="max-w-[79rem] px-4 lg:px-2 mx-auto">

      {showAuthModal && <AuthModel setShowAuthModel={setShowAuthModal} setUser={setUser} />}
      {showUploadModal && <UploadModal setShowUploadModal={setShowUploadModal} user={user} />}
      
      {isMobile && (
        <>
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          
          <div 
            ref={sidebarRef}
            className={`fixed top-0 left-0 h-full w-[80%] max-w-[300px] bg-[#121212] z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-5 flex flex-col h-full">

              <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center" onClick={() => setIsSidebarOpen(false)}>
                  <i className="ri-play-circle-line text-2xl text-[#d6d203] mr-3"></i>
                  <h1 className="font-inter text-xl font-semibold text-white">
                    Lumeroo
                  </h1>
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full hover:bg-[#2a2a2a] transition-colors duration-200"
                >
                  <FiX size={22} className="text-[#c2c2c2] hover:text-white" />
                </button>
              </div>

              <div className="mt-2">
                <h3 className="text-[#9e9e9e] text-xs font-medium uppercase tracking-wider mb-3 pl-2">Categories</h3>
                <div className="flex flex-col space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        handleCategoryNavigation(category.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        flex items-center p-3 rounded-lg transition-all duration-300 ease-out transform hover:scale-[1.02]
                        ${currentActiveCategory === category.id 
                          ? 'bg-[#d6d203]/15 text-[#d6d203] shadow-lg hover:text-[#d6d203]' 
                          : 'text-[#c2c2c2] hover:bg-[#ffffff10] hover:text-white'}
                      `}
                    >
                      <span className="text-xl mr-4">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                <h3 className="text-[#9e9e9e] text-xs font-medium uppercase tracking-wider mb-3 pl-2">Account</h3>
                <div className="flex flex-col space-y-1">
                  <button 
                    onClick={handleProfileNavigation}
                    className="flex items-center p-3 rounded-lg text-[#c2c2c2] hover:bg-[#ffffff10] hover:text-white transition-all duration-200"
                  >
                    <FaUserAlt className="text-lg mr-4" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <button 
                    onClick={handleUploadNavigation}
                    className="flex items-center p-3 rounded-lg text-[#c2c2c2] hover:bg-[#ffffff10] hover:text-white transition-all duration-200"
                  >
                    <RiVideoUploadFill className="text-lg mr-4" />
                    <span className="font-medium">Upload Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isMobile ? (
        <div className="flex flex-col md:hidden">
          <div className="relative h-[4rem] flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <FiMenu 
                size={24} 
                className="text-[#c2c2c2] cursor-pointer hover:text-white transition-colors duration-200" 
                onClick={() => setIsSidebarOpen(true)}
              />
              <IoSearchSharp 
                size={24} 
                className="text-[#c2c2c2] font-bold cursor-pointer hover:text-white transition-colors duration-200" 
                onClick={() => focusSearchInput(true)}
              />
            </div>

            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center cursor-pointer">
              <i className="ri-play-circle-line text-2xl text-[#d6d203]"></i>
              <h1 className="font-inter text-xl font-semibold text-white ml-[0.42rem]">
                Lumeroo
              </h1>
            </Link>

            <div className="flex items-center space-x-5">
              <RiVideoUploadLine 
                size={22} 
                className="text-[#d6d203] cursor-pointer"
                onClick={handleUploadNavigation}
              />
              {user && (user.avatar || avatarUrl) ? (
                <div className="cursor-pointer" onClick={handleProfileNavigation}>
                  <Image
                    src={user.avatar ? (config.stream + user.avatar) : avatarUrl}
                    alt={user.username || "User Avatar"}
                    width={25}
                    height={25}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <FaRegUser
                  size={20}
                  className="text-[#c2c2c2] cursor-pointer"
                  onClick={handleProfileNavigation}
                />
              )}
            </div>
          </div>

          <div className="w-full mb-4">
            <div 
              className="flex items-center w-full border border-[#1f1f1f] bg-[#101010] rounded-lg py-2 px-3 text-sm focus-within:shadow-[0_0_15px_rgba(74,155,2,0.1)] cursor-text"
              onClick={() => focusSearchInput(true)}
            >
              <FiSearch className="text-[#939393] text-lg min-w-[20px]" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search Lumeroo..."
                className="flex-1 text-[1rem] bg-transparent ml-2 text-[#c0c0c0] placeholder-[#808080] focus:outline-none truncate [&::-webkit-search-cancel-button]:appearance-none"
                onKeyDown={handleSearchKeyPress}
              />
              {searchValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    setSearchValue("");
                    focusSearchInput(true);
                  }}
                  className="focus:outline-none"
                >
                  <FiX className="text-[#d6d203a5] hover:text-[#d6d203] text-lg cursor-pointer" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="hidden md:flex flex-col">
          <div className="relative mt-[1.6rem] mb-[0.95rem] flex justify-between items-center">
            <Link href={"/"} className="flex items-center text-[#d6d203] cursor-pointer hover:opacity-90 transition-all ease-out space-x-1.5">
              <i className="ri-play-circle-line  text-2xl text-[#d6d203]"></i>
              <h1 className="font-roboto text-2xl text-[#e7e7e7] font-semibold hidden sm:block">
                Lumeroo
              </h1>
            </Link>

            <div className="flex-1 max-w-xl mx-4 px-2">
              <div 
                className="flex items-center w-full border border-[#1f1f1f] bg-[#101010] rounded-full py-2 sm:py-3 px-3 sm:px-5 text-sm focus-within:shadow-[0_0_15px_rgba(214,210,3,0.055)] transition-all ease-in-out duration-200 cursor-text"
                onClick={() => focusSearchInput(false)}
              >
                <FiSearch className="text-[#939393] text-lg min-w-[20px]" />
                <input
                  ref={desktopSearchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search Lumeroo..."
                  className="flex-1 text-[1rem] bg-transparent ml-2 sm:ml-3 text-[#c0c0c0] placeholder-[#808080] focus:outline-none truncate [&::-webkit-search-cancel-button]:appearance-none"
                  onKeyDown={handleSearchKeyPress}
                />
                {searchValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchValue("");
                      focusSearchInput(false);
                    }}
                    className="focus:outline-none"
                  >
                    <FiX className="text-[#d6d203a5] ml-2 hover:text-[#d6d203] text-lg cursor-pointer" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={handleUploadNavigation}
                className="flex items-center cursor-pointer justify-center bg-[#d6d203c9] hover:scale-[1.03] duration-200 transition-all ease-out text-[#202020] group rounded-full p-2 sm:py-2 sm:px-4"
              >
                <RiVideoUploadFill size={20} className="" />
                <span className="font-pop font-semibold hidden sm:ml-2 md:inline">
                  Upload
                </span>
              </button>

              <div 
                className="cursor-pointer" 
                onClick={handleProfileNavigation}
              >
                <div className={`group hover:scale-[1.05] transition-scale bg-[#181818] ${user && (user.avatar || avatarUrl) ? "border-2 border-[#323232]" : "p-[0.55rem] border-2 border-[#595959]"} rounded-full ease-out duration-200 flex items-center justify-center overflow-hidden`}>
                  {user && (user.avatar || avatarUrl) ? (
                    <Image
                      src={user.avatar ? (config.stream + user.avatar) : avatarUrl}
                      alt={user.username || "User Avatar"}
                      width={41}
                      height={41}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <FaUserAlt
                      size={18}
                      className="text-[#c2c2c2] group-hover:text-[#cfcfcf]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isMobile && showCategories && (
            <div className="categories-nav py-2 mb-2 overflow-x-auto scrollbar-hide hidden md:block [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-center justify-between w-full gap-1">
                {categories.map((category) => {
                  const isActive = currentActiveCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryNavigation(category.id)}
                      className={[
                        'flex-1 cursor-pointer transition-all ease-in-out duration-300 whitespace-nowrap transform border-2',
                        // Large screens
                        'lg:flex lg:flex-row lg:items-center lg:justify-center lg:px-3 lg:py-[0.6rem] lg:rounded-full',
                        'lg:hover:scale-[1.025] lg:transform-gpu lg:mx-0.5',
                        isActive
                          ? 'lg:border-[#d6d2036c] bg-[#d6d2031f] lg:font-medium lg:shadow-[0_6px_20px_rgba(214,210,3,0.01)]'
                          : 'lg:border-transparent lg:bg-[#151515] lg:hover:bg-[#1c1c1c] lg:text-[#b3b3b3] lg:hover:shadow-[0_4px_12px_rgba(255,255,255,0.01)]',
                        // Medium screens
                        'md:flex md:flex-row md:items-center md:justify-center md:px-2 md:py-1.5',
                        'md:mx-0.5',
                        isActive
                          ? 'md:text-[#d6d203] md:font-medium'
                          : 'md:text-[#b3b3b3]',
                        // Small screens
                        'flex flex-col items-center justify-center px-1 py-1',
                        'mx-0.5',
                        isActive
                          ? 'text-[#d6d203] font-medium border-[#d6d203]'
                          : 'text-[#b3b3b3] border-transparent',
                      ].filter(Boolean).join(' ')}
                    >
                      <div className="flex items-center justify-center">
                        <span className="lg:mr-2 md:mr-1.5 text-base sm:text-lg block mb-1 md:mb-0">{category.icon}</span>
                        <span className="text-[10px] sm:text-xs md:text-sm font-pop font-medium">{category.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavBar;
