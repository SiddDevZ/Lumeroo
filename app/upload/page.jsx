"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiImageAddLine,
  RiVideoAddLine,
  RiUpload2Line,
  RiArrowGoBackLine,
  RiCloseLine,
} from "react-icons/ri";
import Link from "next/link";
import config from "../../config.json";
import { Toaster, toast } from "sonner";

const UploadPageLoading = () => {
  return (
    <div className="md:py-14 py-7 flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-t-[#b8b002] border-r-[#b8b002] border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium">Loading upload page...</p>
      </div>
    </div>
  );
};

const UploadPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploadType = searchParams.get("type") || "video";

  const TITLE_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;
  const MAX_TAGS = 10;
  const MAX_TAG_LENGTH = 25;

  const [filePreview, setFilePreview] = useState(null);
  const [fileSelected, setFileSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const MAX_GALLERY_FILES = 12;

  const fileInputRef = React.useRef(null);
  const replaceInputRef = React.useRef(null);
  const thumbnailInputRef = React.useRef(null);

  const pageTitle = uploadType === "photo" ? "Upload Photo" : "Upload Video";
  const TypeIcon = uploadType === "photo" ? RiImageAddLine : RiVideoAddLine;

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        resolve(duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Error loading video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      try {
        const response = await fetch(`${config.url}/api/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        if (!data.success || !data.user) {
          localStorage.removeItem("token"); 
          router.push("/");
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  const resetFormData = () => {
    setFilePreview(null);
    setFileSelected(null);
    setTitle("");
    setDescription("");
    setTags("");
    setIsUploading(false);
    setIsDragging(false);
    setThumbnailFile(null);
    setVideoDuration(null);
    setGalleryFiles([]);
    setSelectedThumbnailIndex(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  useEffect(() => {
    resetFormData();
  }, [uploadType]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (uploadType === "photo") {
      const validImages = files.filter((file) => file.type.startsWith("image/"));
      if (validImages.length === 0) {
        toast.error("Please select valid image files");
        return;
      }

      if (galleryFiles.length + validImages.length > MAX_GALLERY_FILES) {
        toast.info(`You can upload a maximum of ${MAX_GALLERY_FILES} images.`);
      }

      const newGallery = [...galleryFiles, ...validImages].slice(0, MAX_GALLERY_FILES);
      setGalleryFiles(newGallery);

      if (!fileSelected) {
        setFileSelected(newGallery[0]);
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(newGallery[0]);
      }

      if (selectedThumbnailIndex === null && newGallery.length > 0) {
        setSelectedThumbnailIndex(0);
      }
    } else if (uploadType === "video") {
      const videoFile = files.find((file) => file.type.startsWith("video/"));
      if (!videoFile) {
        toast.error("Please select a valid video file");
        return;
      }
      setFileSelected(videoFile);

      try {
        const duration = await getVideoDuration(videoFile);
        setVideoDuration(duration);
        console.log(`Video duration: ${duration} seconds`);
      } catch (error) {
        console.warn("Could not extract video duration:", error);
        setVideoDuration(null);
      }

      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(videoFile);
    }
  };

  const handleFileReplace = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (uploadType === "photo") {
      const validImages = files.filter((file) => file.type.startsWith("image/"));
      if (validImages.length === 0) {
        toast.error("Please select valid image files");
        return;
      }

      const newFile = validImages[0];
      const newGallery = [...galleryFiles];
      newGallery[selectedThumbnailIndex] = newFile;
      setGalleryFiles(newGallery);

      setFileSelected(newFile);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(newFile);

      toast.success("Image replaced successfully");
    } else if (uploadType === "video") {
      const videoFile = files.find((file) => file.type.startsWith("video/"));
      if (!videoFile) {
        toast.error("Please select a valid video file");
        return;
      }

      setFileSelected(videoFile);

      try {
        const duration = await getVideoDuration(videoFile);
        setVideoDuration(duration);
        console.log(`Video duration: ${duration} seconds`);
      } catch (error) {
        console.warn("Could not extract video duration:", error);
        setVideoDuration(null);
      }

      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(videoFile);

      toast.success("Video replaced successfully");
    }

    e.target.value = '';
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for thumbnail");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail must be less than 5MB");
      return;
    }

    setThumbnailFile(file);
    toast.success("Thumbnail selected successfully");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);

      if (uploadType === "photo") {
        const validImages = files.filter((file) => file.type.startsWith("image/"));
        if (validImages.length === 0) {
          toast.error("Please drop valid image files");
          return;
        }

        if (galleryFiles.length + validImages.length > MAX_GALLERY_FILES) {
          toast.info(`You can upload a maximum of ${MAX_GALLERY_FILES} images. Only the first ${MAX_GALLERY_FILES - galleryFiles.length} will be added.`);
        }

        const newGallery = [...galleryFiles, ...validImages].slice(0, MAX_GALLERY_FILES);
        setGalleryFiles(newGallery);

        if (!fileSelected) {
          setFileSelected(newGallery[0]);
          const reader = new FileReader();
          reader.onload = () => {
            setFilePreview(reader.result);
          };
          reader.readAsDataURL(newGallery[0]);
        }

        if (selectedThumbnailIndex === null && newGallery.length > 0) {
          setSelectedThumbnailIndex(0);
        }
      } else if (uploadType === "video") {
        const videoFile = files.find((file) => file.type.startsWith("video/"));
        if (!videoFile) {
          toast.error("Please drop a valid video file");
          return;
        }

        setFileSelected(videoFile);

        try {
          const duration = await getVideoDuration(videoFile);
          setVideoDuration(duration);
          console.log(`Video duration: ${duration} seconds`);
        } catch (error) {
          console.warn("Could not extract video duration:", error);
          setVideoDuration(null);
        }

        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(videoFile);
      }
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (newTitle.length <= TITLE_MAX_LENGTH) {
      setTitle(newTitle);
    }
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;

    const newLineCount = (newDescription.match(/\n/g) || []).length;

    if (newDescription.length <= DESCRIPTION_MAX_LENGTH && newLineCount <= 10) {
      setDescription(newDescription);
    } else if (newLineCount > 10) {
      const lines = newDescription.split("\n");
      if (lines.length > 11) {
        const limitedText = lines.slice(0, 11).join("\n");
        setDescription(limitedText);

        toast.info("Maximum 10 line breaks allowed in description");
      }
    }
  };

  const handleTagsChange = (e) => {
    const inputValue = e.target.value;

    const sanitizedInput = inputValue.replace(/[^a-zA-Z0-9 ]/g, "");

    const tagArray = sanitizedInput.split(" ").filter((tag) => tag !== "");

    const oversizedTagIndex = tagArray.findIndex(
      (tag) => tag.length > MAX_TAG_LENGTH
    );

    if (oversizedTagIndex !== -1) {
      tagArray[oversizedTagIndex] = tagArray[oversizedTagIndex].substring(
        0,
        MAX_TAG_LENGTH
      );
      const truncatedInput = tagArray.join(" ");
      setTags(truncatedInput);

      toast.info(`Tags must be ${MAX_TAG_LENGTH} characters or less`);
      return;
    }

    if (tagArray.length <= MAX_TAGS) {
      setTags(sanitizedInput);
    } else {
      const limitedTags = tagArray.slice(0, MAX_TAGS).join(" ");
      setTags(limitedTags);

      toast.info(`Maximum ${MAX_TAGS} tags allowed`);
    }
  };

  const isUploadReady = () => {
    if (uploadType === "photo") {
      return galleryFiles.length > 0 && title.trim() && description.trim();
    } else if (uploadType === "video") {
      return fileSelected && title.trim() && description.trim();
    }
    return false;
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast.error("Authentication failed. Please log in again.");
      router.push("/");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No token found. Please log in.");
      router.push("/");
      return;
    }

    if (uploadType === "photo") {
      if (galleryFiles.length === 0) {
        toast.error("Please select at least one image to upload");
        return;
      }
      if (!title.trim()) {
        toast.error("Please enter a title for your upload");
        return;
      }
      if (!description.trim()) {
        toast.error("Please write a description for your upload");
        return;
      }
    } else if (uploadType === "video") {
      if (!fileSelected) {
        toast.error("Please select a video file to upload");
        return;
      }
      if (!title.trim()) {
        toast.error("Please enter a title for your video");
        return;
      }
      if (!description.trim()) {
        toast.error("Please write a description for your video");
        return;
      }
    }

    setIsUploading(true);

    toast.loading("Uploading your content...", {
      id: "upload-toast",
      duration: Infinity,
    });

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", tags);
    formData.append("token", token);

    if (uploadType === "video") {
      formData.append("videoFile", fileSelected);
      if (videoDuration !== null) {
        formData.append("duration", videoDuration.toString());
      }
      if (thumbnailFile) {
        formData.append("thumbnailFile", thumbnailFile);
      }
    } else if (uploadType === "photo") {
      formData.append("thumbnailIndex", selectedThumbnailIndex.toString());
      
      galleryFiles.forEach((file, index) => {
        formData.append(`imageFile${index}`, file);
      });
    }

    try {
      const apiEndpoint = uploadType === "photo" ? "/api/uploadImage" : "/api/uploadVideo";
      
      const response = await fetch(`${config.url}${apiEndpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error during upload." }));
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`${uploadType === "photo" ? "Images" : "Video"} uploaded successfully!`, {
          id: "upload-toast",
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        throw new Error(result.message || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Upload failed: ${error.message}`, {
        id: "upload-toast",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="md:py-14 py-7">
      <Toaster theme="dark" position="bottom-right" richColors />

      <div className="mb-8 max-w-[79rem] lg:px-0 px-4 mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="md:text-3xl text-2xl font-bold text-white flex items-center">
            <TypeIcon className="mr-3 text-[#b8b002] sm:text-4xl text-3xl" />
            {pageTitle}
          </h1>
          <Link
            href="/"
            className="flex items-center text-[#cccccc] hover:text-white transition-colors"
          >
            <RiArrowGoBackLine className="mr-2" />
            Back
          </Link>
        </div>
        <p className="text-[#a0a0a0] text-sm sm:text-base mt-1.5 sm:mt-2">
          {uploadType === "photo"
            ? "Share your photos with the Lumeroo community"
            : "Share your videos with the Lumeroo community"}
        </p>
      </div>

      <div className="max-w-[79rem] lg:px-0 px-3 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div
            className={`
              relative aspect-video rounded-xl overflow-hidden
              ${
                !filePreview
                  ? "border-2 border-dashed border-[#3a3a3a] bg-[#1a1a1aba] hover:border-[#b8b002] cursor-pointer transition-colors"
                  : ""
              }
              ${
                isDragging && !filePreview
                  ? "border-[#b8b002] bg-[#1e1e1e]"
                  : ""
              }
            `}
            onClick={() => !filePreview && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {filePreview ? (
              <>
                {uploadType === "photo" ? (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-full object-contain bg-[#1a1a1a]"
                  />
                ) : (
                  <video
                    src={filePreview}
                    controls
                    className="w-full h-full object-contain bg-[#1a1a1a]"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                <div className="absolute right-3 top-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      replaceInputRef.current?.click();
                    }}
                    className="bg-[#2a2a2a] font-inter hover:bg-[#3a3a3a] text-[#f9f9f9] py-2 px-4 rounded-full transition-colors text-sm"
                  >
                    Replace
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <TypeIcon className="text-[#929292] sm:text-6xl text-7xl mb-2" />
                <h3 className="md:text-xl font-semibold text-white mb-1">
                  {uploadType === "photo"
                    ? "Click or drag to upload a photo"
                    : "Click or drag to upload a video"}
                </h3>
                <p className="text-[#a0a0a0] text-sm mb-4">
                  {uploadType === "photo"
                    ? "JPG, PNG, GIF, WebP up to 30MB"
                    : "MP4, WebM, MOV up to 1GB"}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 px-6 rounded-full transition-colors"
                >
                  Select File
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={uploadType === "photo"}
            accept={uploadType === "photo" ? "image/*" : "video/*"}
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            ref={replaceInputRef}
            type="file"
            accept={uploadType === "photo" ? "image/*" : "video/*"}
            onChange={handleFileReplace}
            className="hidden"
          />

          <div className="md:mt-6 mt-3.5 p-4 bg-[#1a1a1ac2] rounded-xl border border-[#2a2a2a]">
            <h3 className="text-white font-medium mb-3">Switch Upload Type</h3>
            <div className="grid grid-cols-2 gap-3 font-inter font-medium">
              <button
                onClick={() => {
                  if (uploadType !== "photo") {
                    resetFormData();
                    router.push("/upload?type=photo");
                  }
                }}
                className={`flex items-center cursor-pointer justify-center md:p-3 p-[10px] rounded-lg transition-colors ${
                  uploadType === "photo"
                    ? "bg-[#b8b002] text-[#202020]"
                    : "bg-[#2a2a2a] text-[#cccccc] hover:bg-[#3a3a3a] hover:text-white"
                }`}
              >
                <RiImageAddLine className="mr-2 text-lg" />
                Photo
              </button>

              <button
                onClick={() => {
                  if (uploadType !== "video") {
                    resetFormData();
                    router.push("/upload?type=video");
                  }
                }}
                className={`flex items-center cursor-pointer justify-center md:p-3 p-[10px] rounded-lg transition-colors ${
                  uploadType === "video"
                    ? "bg-[#b8b002] text-[#202020]"
                    : "bg-[#2a2a2a] text-[#cccccc] hover:bg-[#3a3a3a] hover:text-white"
                }`}
              >
                <RiVideoAddLine className="mr-2 text-lg" />
                Video
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a1abb] md:p-[26px] p-[24px] rounded-xl border border-[#2a2a2a]">
          <h2 className="text-xl font-semibold text-white mb-5">
            Upload Details
          </h2>

          <div className="space-y-1">
            <div>
              <label
                htmlFor="title"
                className="block text-[#cccccc] mb-2 text-sm"
              >
                Title <span className="text-[#b8b002]">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder={`Enter a title for your ${uploadType}`}
                className="w-full bg-[#101010] text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a3a002] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
                required
                maxLength={TITLE_MAX_LENGTH}
              />
              <div className="flex justify-end mt-1.5">
                <span
                  className={`text-xs ${
                    title.length >= TITLE_MAX_LENGTH * 0.9
                      ? "text-[#b8b002]"
                      : "text-[#707070]"
                  }`}
                >
                  {title.length}/{TITLE_MAX_LENGTH}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-[#cccccc] mb-2 text-sm"
              >
                Description <span className="text-[#b8b002]">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Tell viewers about your content..."
                rows={5}
                className="w-full bg-[#101010] text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a3a002] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all resize-none"
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
              <div className="flex justify-end mt-1.5">
                <span
                  className={`text-xs ${
                    description.length >= DESCRIPTION_MAX_LENGTH * 0.9
                      ? "text-[#b8b002]"
                      : "text-[#707070]"
                  }`}
                >
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="tags"
                className="block text-[#cccccc] mb-2 text-sm"
              >
                Tags (space separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={handleTagsChange}
                placeholder="e.g. funny cute gaming"
                className="w-full bg-[#101010] text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a3a002] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
              />
              <div className="flex justify-end mt-1.5">
                <span
                  className={`text-xs ${
                    tags.split(" ").filter((tag) => tag !== "").length >=
                    MAX_TAGS * 0.9
                      ? "text-[#b8b002]"
                      : "text-[#707070]"
                  }`}
                >
                  {tags.split(" ").filter((tag) => tag !== "").length}/
                  {MAX_TAGS} tags
                </span>
              </div>
            </div>

            {uploadType === "video" && (
              <div>
                <label
                  htmlFor="thumbnail"
                  className="block text-[#cccccc] mb-2 text-sm"
                >
                  Thumbnail
                </label>
                <div className="border border-[#2a2a2a] rounded-lg p-4 bg-[#101010]">
                  {!thumbnailFile && (
                    <p className="text-sm text-[#a0a0a0] mb-3">
                      A thumbnail will be generated automatically, or you can
                      upload a custom one.
                    </p>
                  )}

                  {thumbnailFile ? (
                    <div className="mb-3 flex items-center space-x-3">
                      <div className="relative w-24 h-14 bg-[#151515] rounded overflow-hidden flex-shrink-0">
                        <img
                          src={URL.createObjectURL(thumbnailFile)}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#9ce67b] font-medium flex items-center mb-1">
                          <span className="inline-block mr-1">✓</span> Custom
                          thumbnail selected
                        </p>
                        <p className="text-xs text-[#a0a0a0] truncate">
                          {thumbnailFile.name}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="bg-[#2a2a2a] cursor-pointer hover:bg-[#3a3a3a] text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      {thumbnailFile ? "Change Thumbnail" : "Upload Thumbnail"}
                    </button>

                    {thumbnailFile && (
                      <button
                        onClick={() => setThumbnailFile(null)}
                        className="bg-[#2a2a2a40] cursor-pointer hover:bg-[#3a3a3a] text-[#cccccc] py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {uploadType === "photo" && (
              <div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-medium">Gallery Images ({galleryFiles.length}/{MAX_GALLERY_FILES})</h3>
                    {galleryFiles.length > 0 && (
                      <div className="flex items-center">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-1.5 px-3 rounded transition-colors flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add More
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {galleryFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                          selectedThumbnailIndex === index 
                            ? 'border-[#b8b002] scale-[1.03] shadow-md' 
                            : 'border-transparent hover:border-[#b8b002]/50 hover:scale-[1.02]'
                        } transition-all duration-150`}
                        onClick={() => {
                          setFileSelected(file);
                          const reader = new FileReader();
                          reader.onload = () => {
                            setFilePreview(reader.result);
                          };
                          reader.readAsDataURL(file);
                          setSelectedThumbnailIndex(index);
                        }}
                      >
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Gallery image ${index+1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newFiles = [...galleryFiles];
                            newFiles.splice(index, 1);
                            setGalleryFiles(newFiles);
                            
                            if (selectedThumbnailIndex === index) {
                              if (newFiles.length > 0) {
                                setSelectedThumbnailIndex(0);
                                setFileSelected(newFiles[0]);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setFilePreview(reader.result);
                                };
                                reader.readAsDataURL(newFiles[0]);
                              } else {
                                setSelectedThumbnailIndex(0);
                                setFileSelected(null);
                                setFilePreview(null);
                              }
                            } else if (selectedThumbnailIndex > index) {
                              setSelectedThumbnailIndex(selectedThumbnailIndex - 1);
                            }
                          }}
                          className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-1 transition-all"
                        >
                          <RiCloseLine className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    
                    {galleryFiles.length < MAX_GALLERY_FILES && (
                      <div 
                        className="aspect-square rounded-md border-2 border-dashed border-[#3a3a3a] flex flex-col items-center justify-center cursor-pointer hover:border-[#b8b002] hover:bg-[#1f1f1f] transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#5a5a5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-[0.65rem] text-[#7a7a7a] mt-1 px-1 text-center">Add Images</span>
                      </div>
                    )}
                  </div>
                  
                  {galleryFiles.length > 0 && (
                    <p className="mt-3 text-[#a0a0a0] text-xs">
                      Click on an image to select it as the thumbnail. 
                      {galleryFiles.length > 1 ? ` Currently using image ${selectedThumbnailIndex + 1} as thumbnail.` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                w-full py-3 px-6 rounded-lg flex items-center justify-center font-medium text-base mt-4
                ${
                  isUploading
                    ? "bg-[#4a4a4a] text-[#a0a0a0] cursor-not-allowed"
                    : isUploadReady()
                    ? "bg-[#b8b002] hover:bg-[#a3a002] text-[#202020] transition-all duration-200"
                    : "bg-[#4a4a4a] text-[#a0a0a0] cursor-pointer hover:bg-[#5a5a5a] transition-all duration-200"
                }
              `}
            >
              <RiUpload2Line size={20} className="mr-2" />
              {isUploading ? "Uploading..." : "Upload Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadPage = () => {
  return (
    <Suspense fallback={<UploadPageLoading />}>
      <UploadPageContent />
    </Suspense>
  );
};

export default UploadPage;
