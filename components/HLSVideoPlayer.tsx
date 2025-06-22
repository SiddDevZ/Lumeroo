import React, { useRef, useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

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
          });

          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('HLS: Manifest parsed, found', data.levels.length, 'quality levels');
            setIsLoading(false);
            if (onLoadedMetadata) {
              onLoadedMetadata();
            }
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            // Handle different types of errors more gracefully
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

          hls.on(Hls.Events.FRAG_LOADED, () => {
          });

          hls.on(Hls.Events.BUFFER_APPENDED, () => {
          });

          hls.attachMedia(video);
          hls.loadSource(src);

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (onLoadedMetadata) {
              onLoadedMetadata();
            }
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

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onLoadedMetadata, onError]);

  const handleVideoError = () => {
    setError('Video playback error');
    if (onError) {
      onError('Video playback error');
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#1a1a1a] border-t-[#d6d203] rounded-full animate-spin mb-3"></div>
            <p className="text-white text-base">Loading video...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={controls}
        autoPlay={autoplay}
        muted={muted}
        poster={poster}
        onError={handleVideoError}
        style={{ backgroundColor: 'black' }}
        playsInline
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default HLSVideoPlayer;