"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Download, ZoomIn, RotateCw, RefreshCw, Move, Check, MessageCircle } from "lucide-react";

interface FrameEditorProps {
  frameUrl: string;
  campaignTitle: string;
  onSuccessSubmit: () => void; // Trigger sheet saves, etc.
}

export default function FrameEditor({ frameUrl, campaignTitle, onSuccessSubmit }: FrameEditorProps) {
  const [frameAspect, setFrameAspect] = useState<number>(1);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [hasShared, setHasShared] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);

  // Clean up object URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  // Load frame image pre-emptively
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = frameUrl;
    img.onload = () => {
      frameImgRef.current = img;
      if (img.naturalWidth && img.naturalHeight) {
        setFrameAspect(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [frameUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      
      // Reset editor values
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setIsDownloaded(false);
      setHasShared(false);

      // Load user image
      const img = new Image();
      img.src = url;
      img.onload = () => {
        photoImgRef.current = img;
      };
    }
  };

  // Drag handlers (Mouse + Touch)
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!photoUrl) return;
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Canvas Merging & Exporting
  const handleMergeAndDownload = () => {
    if (!photoImgRef.current || !frameImgRef.current || !canvasRef.current || !containerRef.current) {
      alert("Please upload your photo first!");
      return;
    }

    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const userImg = photoImgRef.current;
    const frameImg = frameImgRef.current;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Use natural frame image size as canvas size, default to 1080x1080
    const canvasWidth = frameImg.naturalWidth || frameImg.width || 1080;
    const canvasHeight = frameImg.naturalHeight || frameImg.height || 1080;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scale factor from preview display size to high-res canvas
    const scaleFactorX = canvasWidth / containerWidth;
    const scaleFactorY = canvasHeight / containerHeight;

    // Center coordinates
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    ctx.save();
    
    // Translate to center + user drag offset (scaled up to high resolution)
    const renderX = centerX + offset.x * scaleFactorX;
    const renderY = centerY + offset.y * scaleFactorY;
    ctx.translate(renderX, renderY);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate drawing size of user image keeping aspect ratio
    const imgRatio = userImg.width / userImg.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;

    if (imgRatio > canvasRatio) {
      // User image is wider: crop left/right
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
    } else {
      // User image is taller: crop top/bottom
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
    }

    // Apply scale set by the zoom slider
    const finalWidth = drawWidth * scale;
    const finalHeight = drawHeight * scale;

    // Draw user image centered at origin
    ctx.drawImage(userImg, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

    ctx.restore();

    // Draw the transparent frame image exactly fitting the canvas size
    ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);

    // Trigger download
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      const slugifiedTitle = campaignTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      
      downloadLink.href = dataUrl;
      downloadLink.download = `${slugifiedTitle}-twibbon.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setIsDownloaded(true);
      onSuccessSubmit(); // Trigger database sheet logging
    } catch (error) {
      console.error("Canvas security error or render error:", error);
      alert("A security/cross-origin error occurred. Please try uploading a different photo or using another browser.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setIsDownloaded(false);
    setHasShared(false);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Target Canvas Hidden for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Editor Main Canvas Wrapper */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[360px] rounded-3xl overflow-hidden glass-panel border border-opacity-40 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        style={{ aspectRatio: frameAspect }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => {
          if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleDragEnd}
      >
        {photoUrl ? (
          <>
            {/* User uploaded image */}
            <div
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
                width: "100%",
                height: "100%",
              }}
            >
              <img
                src={photoUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover pointer-events-none"
              />
            </div>
            
            {/* Floating indicator */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 opacity-70 pointer-events-none">
              <Move className="w-3 h-3" />
              <span>Drag to position</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center p-6 text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-primary-light flex items-center justify-center mb-3">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground mb-1">Upload your profile photo</p>
            <p className="text-xs">Supports high-res PNG, JPEG, WEBP files</p>
          </div>
        )}

        {/* Transparent Frame PNG overlay */}
        <img
          src={frameUrl}
          alt="Campaign Frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />
      </div>

      {/* Editor Controls */}
      {photoUrl && (
        <div className="w-full max-w-[360px] glass-panel rounded-2xl p-5 border border-opacity-30 space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="flex items-center gap-1 text-muted-foreground">
                <ZoomIn className="w-3.5 h-3.5" />
                Zoom / Scale
              </span>
              <span className="text-primary">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-primary-light rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Rotation Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="flex items-center gap-1 text-muted-foreground">
                <RotateCw className="w-3.5 h-3.5" />
                Rotate Photo
              </span>
              <span className="text-primary">{rotation}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-1.5 bg-primary-light rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Button actions inside controls */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2 px-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 text-foreground text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Photo
            </button>
          </div>
        </div>
      )}

      {/* Upload File trigger & download */}
      <div className="w-full max-w-[360px] space-y-3">
        <label className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-foreground text-background font-bold cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] text-sm shadow-md">
          <Upload className="w-4 h-4" />
          {photoUrl ? "Change Photo" : "Choose Profile Photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </label>

        {photoUrl && (
          <div className="flex flex-col gap-3 w-full">
            {!hasShared ? (
              <button
                onClick={() => {
                  const text = `I just joined the ${campaignTitle} campaign! Join me and generate your own frame here: ${window.location.href}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                  setHasShared(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-white font-bold transition-all active:scale-[0.99] text-sm shadow-md bg-[#25D366] hover:bg-[#20bd5a] animate-pulse"
              >
                <MessageCircle className="w-4 h-4" />
                Share to WhatsApp to Unlock Download
              </button>
            ) : (
              <button
                onClick={handleMergeAndDownload}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-white font-bold transition-all active:scale-[0.99] text-sm shadow-md ${
                  isDownloaded
                    ? "bg-success hover:opacity-90"
                    : "bg-gradient-to-r from-primary to-pink-500 hover:opacity-95"
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating High-Res...
                  </>
                ) : isDownloaded ? (
                  <>
                    <Check className="w-4 h-4" />
                    Downloaded successfully!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Generated Image
                  </>
                )}
              </button>
            )}
            
            {hasShared && !isDownloaded && (
              <p className="text-[10px] text-center text-muted-foreground font-semibold">
                Thanks for sharing! You can now download your image.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
