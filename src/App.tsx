// src/App.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Triangle,
  Move,
  RotateCw,
  Maximize2,
} from "lucide-react";

interface OverlayState {
  x: number; // percentage left (0-100)
  y: number; // percentage top (0-100)
  scale: number; // multiplier
  rotation: number; // degrees
  opacity: number; // 0-1
}

const overlayImageUrl = "/aztec-chain.png"; // <-- Put your chain PNG into public/ folder and name it aztec-chain.png

export default function App(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageRect, setImageRect] = useState<DOMRect | null>(null);

  const [overlay, setOverlay] = useState<OverlayState>({
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 0.95,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Update image bounding rect (used to convert mouse coords to percentages)
  const updateImageRect = useCallback(() => {
    if (imageContainerRef.current) {
      const r = imageContainerRef.current.getBoundingClientRect();
      setImageRect(r);
    } else {
      setImageRect(null);
    }
  }, []);

  useEffect(() => {
    updateImageRect();
    window.addEventListener("resize", updateImageRect);
    return () => window.removeEventListener("resize", updateImageRect);
  }, [updateImageRect, uploadedImage]);

  // File upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      // reset overlay
      setOverlay({ x: 50, y: 50, scale: 1, rotation: 0, opacity: 0.95 });
      // wait a tick and recalc bounding rect
      setTimeout(updateImageRect, 50);
    };
    reader.readAsDataURL(file);
  };

  // Start actions
  const startAction = (
    clientX: number,
    clientY: number,
    action: "drag" | "resize" | "rotate"
  ) => {
    if (!imageRect) return;
    dragStartRef.current = { x: clientX - imageRect.left, y: clientY - imageRect.top };
    if (action === "drag") setIsDragging(true);
    if (action === "resize") setIsResizing(true);
    if (action === "rotate") setIsRotating(true);
  };

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize" | "rotate") => {
    e.preventDefault();
    e.stopPropagation();
    startAction(e.clientX, e.clientY, action);
  };

  const handleTouchStart = (e: React.TouchEvent, action: "drag" | "resize" | "rotate") => {
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    startAction(t.clientX, t.clientY, action);
  };

  // Move handlers (shared between mouse/touch)
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!imageRect) return;
      const localX = clientX - imageRect.left;
      const localY = clientY - imageRect.top;

      if (isDragging && dragStartRef.current) {
        // Move overlay: compute percent coords
        const newXPercent = Math.max(0, Math.min(100, (localX / imageRect.width) * 100));
        const newYPercent = Math.max(0, Math.min(100, (localY / imageRect.height) * 100));
        setOverlay((prev) => ({ ...prev, x: newXPercent, y: newYPercent }));
      } else if (isResizing && dragStartRef.current) {
        const centerX = (overlay.x / 100) * imageRect.width;
        const centerY = (overlay.y / 100) * imageRect.height;
        const dx = localX - centerX;
        const dy = localY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const baseDistance = Math.min(imageRect.width, imageRect.height) * 0.2;
        const newScale = Math.max(0.2, Math.min(4, distance / baseDistance));
        setOverlay((prev) => ({ ...prev, scale: newScale }));
      } else if (isRotating && dragStartRef.current) {
        const centerX = (overlay.x / 100) * imageRect.width;
        const centerY = (overlay.y / 100) * imageRect.height;
        const angle = Math.atan2(localY - centerY, localX - centerX) * (180 / Math.PI);
        setOverlay((prev) => ({ ...prev, rotation: angle }));
      }
    },
    [imageRect, isDragging, isResizing, isRotating, overlay.x, overlay.y]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };
    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
      dragStartRef.current = null;
    };

    if (isDragging || isResizing || isRotating) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onUp);
      return () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onUp);
      };
    }
    return;
  }, [isDragging, isResizing, isRotating, handleMove]);

  // Download / draw to canvas
  const downloadImage = async () => {
    if (!uploadedImage) {
      console.warn("No uploaded image to download.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas ref missing");
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("2D context unavailable");
      return;
    }

    try {
      // load base image (uploaded - data URL or file URL)
      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        // uploadedImage is often a data URL (no CORS needed). If it's external, you may need crossOrigin.
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        i.src = uploadedImage;
      });

      // size canvas like base image
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // draw base
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // load overlay image
      const overlayImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous"; // IMPORTANT: overlay must be same-origin or CORS-enabled for export
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        i.src = overlayImageUrl;
      });

      // compute overlay draw size preserving aspect ratio
      const overlayBase = Math.min(canvas.width, canvas.height) * 0.32; // base size relative to canvas
      const aspect = overlayImg.width / overlayImg.height;
      const drawW = overlayBase * overlay.scale;
      const drawH = drawW / aspect;

      // compute center position in pixels
      const centerX = (overlay.x / 100) * canvas.width;
      const centerY = (overlay.y / 100) * canvas.height;

      ctx.save();
      ctx.globalAlpha = overlay.opacity;
      ctx.translate(centerX, centerY);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.drawImage(overlayImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // create download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "aztec-gold-chain.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error preparing download:", err);
      alert(
        "Export failed. If the overlay is hosted on another domain, CORS may block the download. Place the overlay PNG in /public and try again."
      );
    }
  };

  // Reset overlay
  const resetOverlay = () => {
    setOverlay({ x: 50, y: 50, scale: 1, rotation: 0, opacity: 0.95 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#715ec2] to-purple-600 opacity-90" />
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Triangle className="w-8 h-8 text-[#715ec2]" />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-wider">AZTEC - PRIVACY PLEASE!</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-white">
              <span className="text-lg font-semibold">AZTEC - PRIVACY PLEASE! OVERLAY STUDIO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            AZTEC - PRIVACY PLEASE! <span className="text-[#715ec2]">CHAIN OVERLAY</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Add the iconic AZTEC chain to your images. Drag, resize, rotate — then download a PNG.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Upload + Editor */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-3 text-[#715ec2]" />
              Upload Image
            </h3>

            <div className="border-2 border-dashed border-[#715ec2] rounded-xl p-8 text-center relative">
              {uploadedImage ? (
                <div
                  ref={imageContainerRef}
                  className="relative inline-block max-w-full"
                  style={{ userSelect: "none" }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-w-full max-h-96 rounded-lg shadow-lg"
                    draggable={false}
                    onLoad={updateImageRect}
                  />

                  {/* Interactive overlay element (visual only) */}
                  <div
                    ref={overlayRef}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: `translate(-50%, -50%) scale(${overlay.scale}) rotate(${overlay.rotation}deg)`,
                      opacity: overlay.opacity,
                      zIndex: 40,
                      touchAction: "none",
                      cursor: "move",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, "drag")}
                    onTouchStart={(e) => handleTouchStart(e, "drag")}
                  >
                    <img
                      src={overlayImageUrl}
                      alt="AZTEC Chain"
                      className="w-32 h-32 object-contain pointer-events-none select-none"
                      draggable={false}
                    />

                    {/* Handles */}
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                      {/* Resize */}
                      <div
                        style={{
                          position: "absolute",
                          right: -10,
                          bottom: -10,
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          backgroundColor: "#715ec2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "auto",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, "resize")}
                        onTouchStart={(e) => handleTouchStart(e, "resize")}
                      >
                        <Maximize2 className="w-3 h-3 text-white" />
                      </div>

                      {/* Rotate */}
                      <div
                        style={{
                          position: "absolute",
                          right: -10,
                          top: -10,
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          backgroundColor: "#715ec2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "auto",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, "rotate")}
                        onTouchStart={(e) => handleTouchStart(e, "rotate")}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Upload new image button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-3 right-3 bg-[#715ec2] text-white px-3 py-1 rounded-lg z-50"
                  >
                    New Image
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} style={{ cursor: "pointer" }}>
                  <Upload className="w-16 h-16 text-[#715ec2] mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Click to upload your image</p>
                  <p className="text-gray-400">Add the AZTEC chain overlay and adjust it.</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Controls */}
            {uploadedImage && (
              <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <label className="text-white font-semibold">Opacity</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={overlay.opacity}
                    onChange={(e) => setOverlay((p) => ({ ...p, opacity: parseFloat(e.target.value) }))}
                    className="w-40"
                  />
                  <span className="text-[#715ec2]">{Math.round(overlay.opacity * 100)}%</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetOverlay}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>

                  <button
                    onClick={downloadImage}
                    className="bg-[#715ec2] hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download AZTEC - PRIVACY PLEASE!
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">How to use</h3>
            <div className="grid md:grid-cols-3 gap-4 text-gray-300">
              <div className="flex items-start space-x-3">
                <Move className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Move</p>
                  <p className="text-sm">Drag the chain to reposition it.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Maximize2 className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Resize</p>
                  <p className="text-sm">Drag the bottom-right handle to resize.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <RotateCw className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Rotate</p>
                  <p className="text-sm">Drag the top-right handle to rotate.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas used for exporting */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-12">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center text-gray-400">
          <div className="flex items-center gap-3">
            <Triangle className="w-8 h-8 text-[#715ec2]" />
            <div className="text-white font-bold">AZTEC - PRIVACY PLEASE!</div>
          </div>
          <div>© 2025 AZTEC - PRIVACY PLEASE!. Made by 0xHarish.</div>
        </div>
      </footer>
    </div>
  );
}
