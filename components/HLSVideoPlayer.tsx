import React, { useRef, useEffect, useState } from 'react';
import { FiAlertTriangle, FiPlay, FiRefreshCw, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize } from 'react-icons/fi';

interface HLSVideoPlayerProps {
  src: string;
  poster?: string;
  onLoadedMetadata?: () => void;
  onError?: (error: string) => void;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

const HLSVideoPlayer: React.FC<HLSVideoPlayerProps> = ({
  src,
  poster,
  onLoadedMetadata,
  onError,
  className = "",
  autoplay = false,
  muted = false,
  controls = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);
        setIsVideoReady(false);

        const { default: Hls } = await import('hls.js');

        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: Infinity,
            maxBufferHole: 0.5,
            maxBufferSize: 60 * 1000 * 1000, // 60MB
          });

          hlsRef.current = hls;

          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            console.log('HLS: Media attached');
            setLoadingProgress(25);
          });

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('HLS: Manifest parsed, found', data.levels.length, 'quality levels');
            setLoadingProgress(75);
            setTimeout(() => {
              setIsLoading(false);
              setIsVideoReady(true);
              if (onLoadedMetadata) {
                onLoadedMetadata();
              }
            }, 300);
          });

          hls.on(Hls.Events.FRAG_LOADED, () => {
            setLoadingProgress(50);
          });

          hls.on(Hls.Events.BUFFER_APPENDED, () => {
            setLoadingProgress(90);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error('HLS Fatal Error:', data);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('Fatal network error encountered, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('Fatal media error encountered, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.log('Fatal error, cannot recover');
                  setError('Failed to load video stream');
                  if (onError) {
                    onError('Failed to load video stream');
                  }
                  break;
              }
            } else {
              switch (data.details) {
                case 'bufferSeekOverHole':
                case 'bufferNudgeOnStall':
                case 'bufferAppendError':
                  console.debug('HLS Non-fatal buffer issue (auto-recovering):', data.details);
                  break;
                case 'fragLoadError':
                case 'fragLoadTimeOut':
                  console.log('HLS: Fragment load issue, will retry automatically');
                  break;
                default:
                  console.warn('HLS Non-fatal error:', data.details, data);
                  break;
              }
            }
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            console.log('HLS: Quality switched to level', data.level);
          });

          hls.attachMedia(video);
          hls.loadSource(src);

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          setLoadingProgress(50);
          video.addEventListener('loadedmetadata', () => {
            setLoadingProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              setIsVideoReady(true);
              if (onLoadedMetadata) {
                onLoadedMetadata();
              }
            }, 300);
          });
          video.addEventListener('error', () => {
            setError('Failed to load video');
            if (onError) {
              onError('Failed to load video');
            }
          });
        } else {
          setError('HLS is not supported in this browser');
          if (onError) {
            onError('HLS is not supported in this browser');
          }
        }
      } catch (err) {
        console.error('Error initializing HLS player:', err);
        setError('Failed to initialize video player');
        if (onError) {
          onError('Failed to initialize video player');
        }
      }
    };

    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onLoadedMetadata, onError]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDraggingProgress) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [isVideoReady, isDraggingProgress]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress && progressBarRef.current && duration) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * duration;
        setDragTime(time);
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          setCurrentTime(time); // This makes the visual bar update instantly
        }
      }

      if (isDraggingVolume && volumeBarRef.current) {
        const rect = volumeBarRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(percent);
        if (videoRef.current) {
          videoRef.current.volume = percent;
          if (percent > 0) {
            videoRef.current.muted = false;
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, isDraggingVolume, duration, dragTime]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isPlaying && !isHovering && !isDraggingProgress && !isDraggingVolume && !isFullscreen) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, isHovering, isDraggingProgress, isDraggingVolume, isFullscreen]);

  const handleVideoError = () => {
    setError('Video playback error');
    if (onError) {
      onError('Video playback error');
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setLoadingProgress(0);
    const currentSrc = src;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on controls
    if ((e.target as HTMLElement).closest('.video-controls')) {
      return;
    }
    togglePlayPause(e);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    setIsDraggingProgress(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    setDragTime(time);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration || isDraggingProgress) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    setIsDraggingVolume(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    videoRef.current.volume = percent;
    if (percent > 0) {
      videoRef.current.muted = false;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] border border-[#2a2a2a] ${className}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(214,210,3,0.03),transparent_70%)]" />
        <div className="relative flex flex-col items-center justify-center h-full min-h-[150px] sm:min-h-[200px] p-4 sm:p-8 text-center">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <FiAlertTriangle className="text-red-400 text-2xl sm:text-3xl" />
          </div>
          <h3 className="text-white text-base sm:text-lg font-semibold mb-2">Playback Error</h3>
          <p className="text-[#c2c2c2] text-xs sm:text-sm mb-4 sm:mb-6 max-w-md leading-relaxed">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#d6d203] hover:bg-[#e8e635] text-black font-semibold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#d6d203]/50 text-sm sm:text-base"
          >
            <FiRefreshCw className="text-base sm:text-lg" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${isFullscreen ? 'w-full h-full' : 'rounded-lg sm:rounded-xl'} bg-black ${isFullscreen ? '' : 'border border-[#2a2a2a] shadow-lg sm:shadow-2xl'} ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(214,210,3,0.02),transparent_70%)] pointer-events-none" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] z-20 transition-opacity duration-500">
          <div className="flex flex-col items-center space-y-4 sm:space-y-6 px-4">
            <div className="w-32 sm:w-48 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#d6d203] to-[#e8e635] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            <div className="text-center">
              <p className="text-white text-base sm:text-lg font-medium mb-1">Loading video...</p>
              <p className="text-[#9e9e9e] text-xs sm:text-sm">{loadingProgress}% complete</p>
            </div>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className={`w-full h-full ${isFullscreen ? '' : 'rounded-lg sm:rounded-xl'} transition-opacity duration-700 ${isVideoReady ? 'opacity-100' : 'opacity-0'} cursor-pointer`}
        controls={false}
        autoPlay={autoplay}
        muted={muted}
        poster={poster}
        onError={handleVideoError}
        onClick={handleVideoClick}
        style={{ backgroundColor: 'black' }}
        playsInline
      >
        Your browser does not support the video tag.
      </video>
      
      {controls && isVideoReady && (
        <div className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${showControls || isFullscreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${
          isFullscreen ? 'p-6' : 'p-2 sm:p-4'
        }`}>
          <div className={`${isFullscreen ? 'mb-1' : 'mb-1 sm:mb-1.5'}`}>
            <div 
              ref={progressBarRef}
              className={`w-full cursor-pointer group flex items-center ${isFullscreen ? 'py-3' : 'py-1.5 sm:py-2'}`}
              onMouseDown={handleProgressMouseDown}
              onClick={handleProgressClick}
            >
              <div className={`w-full bg-white/20 rounded-full relative transition-all duration-150 ${isFullscreen ? 'h-1.5' : 'h-0.5 sm:h-1'}`}>
                <div 
                  className={`h-full bg-[#d6d203] rounded-full relative`}
                  style={{ width: `${duration ? ((isDraggingProgress ? dragTime : currentTime) / duration) * 100 : 0}%` }}
                >
                  <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#d6d203] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg ${
                    isFullscreen ? 'w-4 h-4' : 'w-2 h-2 sm:w-3 sm:h-3'
                  }`} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isFullscreen ? 'space-x-3' : 'space-x-1 sm:space-x-2'}`}>
              <button
                onClick={togglePlayPause}
                className={`text-white hover:text-[#d6d203] transition-colors duration-200 hover:bg-white/10 rounded-full cursor-pointer ${
                  isFullscreen ? 'p-3' : 'p-1.5 sm:p-2'
                }`}
              >
                {isPlaying ? <FiPause size={isFullscreen ? 28 : 16} className="sm:text-xl" /> : <FiPlay size={isFullscreen ? 28 : 16} className="sm:text-xl" />}
              </button>

              <div className={`flex mr-4 items-center ${isFullscreen ? 'space-x-4' : 'space-x-1 sm:space-x-2'}`}>
                <button
                  onClick={toggleMute}
                  className={`text-white hover:text-[#d6d203] transition-colors duration-200 hover:bg-white/10 rounded-full cursor-pointer ${
                    isFullscreen ? 'p-3' : 'p-1.5 sm:p-2'
                  }`}
                >
                  {isMuted || volume === 0 ? 
                    <FiVolumeX size={isFullscreen ? 28 : 16} className="sm:text-lg" /> : 
                    <FiVolume2 size={isFullscreen ? 28 : 16} className="sm:text-lg" />
                  }
                </button>

                <div className={`cursor-pointer flex items-center ${isFullscreen ? 'w-32 py-3' : 'w-12 sm:w-20 py-1.5 sm:py-2'}`}>
                  <div 
                    ref={volumeBarRef}
                    className={`w-full bg-white/20 rounded-full relative hover:h-2 transition-all duration-150 ${
                      isFullscreen ? 'h-1.5' : 'h-0.5 sm:h-1'
                    }`}
                    onMouseDown={handleVolumeMouseDown}
                  >
                    <div 
                      className={`h-full bg-[#e8e8e8] rounded-full relative`}
                      style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                    >
                      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#e8e8e8] rounded-full shadow-lg ${
                        isFullscreen ? 'w-3 h-3' : 'w-1.5 h-1.5 sm:w-2 sm:h-2'
                      }`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`text-white font-medium unselectable ${isFullscreen ? 'text-lg' : 'text-xs sm:text-sm'}`}>
                {formatTime(isDraggingProgress ? dragTime : currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className={`flex items-center ${isFullscreen ? 'space-x-6' : 'space-x-2 sm:space-x-4'}`}>
              <button
                onClick={toggleFullscreen}
                className={`text-white hover:text-[#d6d203] transition-colors duration-200 hover:bg-white/10 rounded-full cursor-pointer ${
                  isFullscreen ? 'p-3' : 'p-1.5 sm:p-2'
                }`}
              >
                {isFullscreen ? 
                  <FiMinimize size={isFullscreen ? 24 : 14} className="sm:text-lg" /> : 
                  <FiMaximize size={isFullscreen ? 24 : 14} className="sm:text-lg" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {isVideoReady && (
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isPlaying ? 'opacity-0 scale-75' : 'opacity-100 scale-100'} transition-all ease-out duration-200`}>
          <div 
            className={`bg-white/10 backdrop-blur-sm rounded-full shadow-2xl transform transition-all duration-300  pointer-events-auto cursor-pointer flex items-center justify-center ${
              isFullscreen ? 'w-20 h-20' : 'w-12 h-12 sm:w-16 sm:h-16'
            } ${
              isHovering 
                ? 'scale-110 bg-white/15 ' 
                : 'scale-100 hover:scale-110'
            }`} 
            onClick={togglePlayPause}
          >
            <FiPlay className={`text-white/70 ml-0.5 drop-shadow-lg ${
              isFullscreen ? 'text-3xl' : 'text-lg sm:text-2xl'
            }`} />
          </div>
        </div>
      )}
      
      <div className={`absolute inset-0 border border-transparent bg-gradient-to-r from-[#d6d203]/20 via-transparent to-[#d6d203]/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
        isFullscreen ? '' : 'rounded-lg sm:rounded-xl'
      }`} />
    </div>
  );
};

export default HLSVideoPlayer;