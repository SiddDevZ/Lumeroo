import React, { useState, useRef, useEffect } from "react";
import { RiImageAddLine, RiVideoAddLine, RiCloseLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import Image from "next/image";

const UploadModal = ({ setShowUploadModal, user }) => {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const modalContentRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        modalContentRef.current &&
        !modalContentRef.current.contains(e.target)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const closeModal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowUploadModal(false);
    }, 300);
  };

  const handleUploadTypeSelect = (type) => {
    closeModal();
    router.push(`/upload?type=${type}`);
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 ease-in-out p-4 ${
        isExiting ? "opacity-0" : isEntering ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        ref={modalContentRef}
        className={`w-full max-w-4xl bg-[#121212] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ease-in-out relative
        ${
          isExiting
            ? "scale-95 opacity-0"
            : isEntering
            ? "scale-95 opacity-0"
            : "scale-100 opacity-100"
        }`}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center space-x-2.5">
            <Image
              src="/logo2.webp"
              alt="Lumeroo Logo"
              width={30}
              height={30}
              className="rounded-full opacity-95"
            />
            <h2 className="text-xl font-bold text-white">Upload Content</h2>
          </div>
          <button
            onClick={closeModal}
            className="text-[#cccccc] cursor-pointer hover:text-white hover:rotate-90 transition-all duration-300"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleUploadTypeSelect("photo")}
              className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-[#3a3a3a] hover:border-[#d6d203] bg-[#1a1a1a] hover:bg-[#1e1e1e] rounded-xl cursor-pointer transition-all duration-300 group"
            >
              <RiImageAddLine
                size={64}
                className="text-[#cccccc] group-hover:text-[#d6d203] mb-6 transition-all duration-300"
              />
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Photo
              </h3>
              <p className="text-[#a0a0a0] text-center text-sm">
                JPG, PNG, GIF, WebP, etc.
              </p>
            </button>

            <button
              onClick={() => handleUploadTypeSelect("video")}
              className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-[#3a3a3a] hover:border-[#d6d203] bg-[#1a1a1a] hover:bg-[#1e1e1e] rounded-xl cursor-pointer transition-all duration-300 group"
            >
              <RiVideoAddLine
                size={64}
                className="text-[#cccccc] group-hover:text-[#d6d203] mb-6 transition-all duration-300"
              />
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Video
              </h3>
              <p className="text-[#a0a0a0] text-center text-sm">
                MP4, WebM, MOV, etc.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
