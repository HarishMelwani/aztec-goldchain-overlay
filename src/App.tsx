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

type OverlayState = {
  x: number; // % left
  y: number; // % top
  scale: number;
  rotation: number; // degrees
  opacity: number; // 0-1
};

const OVERLAY_PUBLIC_PATH = "/aztec-chain.png"; // Put aztec-chain.png in public/

export default function App(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayDomRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>({
    x: 50,
    y: 60,
    scale: 1,
    rotation: 0,
    opacity: 0.95,
  });

  // Interaction flags
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Keep latest overlay in a ref so handlers read latest values
  const overlayRef = useRef<OverlayState>(overlay);
  useEffect(() => {
    overlayRef.current = overlay;
  }, [overlay]);

  // Utility clamp
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      // reset overlay on new image
      setOverlay({ x: 50, y: 60, scale: 1, rotation: 0, opacity: 0.95 });
      // small delay to let image layout
      setTimeout(() => {
        imageContainerRef.current?.getBoundingClientRect();
      }, 50);
    };
    reader.readAsDataURL(file);
  };

  // Start action: record initial state (we don't need to persist start coords beyond move)
  const startAction = (
    clientX: number,
    clientY: number,
    action: "drag" | "resize" | "rotate"
  ) => {
    // make sure image container exists
    if (!imageContainerRef.current) return;
    if (action === "drag") setIsDragging(true);
    if (action === "resize") setIsResizing(true);
    if (action === "rotate") setIsRotating(true);
  };

  // Mouse / touch down handlers for control handles and overlay area
  const handleMouseDown = (
    e: React.MouseEvent,
    action: "drag" | "resize" | "rotate"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    startAction(e.clientX, e.clientY, action);
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    action: "drag" | "resize" | "rotate"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    if (!t) return;
    startAction(t.clientX, t.clientY, action);
  };

  // Shared move handler (mouse/touch)
  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const container = imageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      if (isDragging) {
        const newX = clamp((localX / rect.width) * 100, 0, 100);
        const newY = clamp((localY / rect.height) * 100, 0, 100);
        setOverlay((p) => ({ ...p, x: newX, y: newY }));
      } else if (isResizing) {
        const centerX = (overlayRef.current.x / 100) * rect.width;
        const centerY = (overlayRef.current.y / 100) * rect.height;
        const dx = localX - centerX;
        const dy = localY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const baseDistance = Math.min(rect.width, rect.height) * 0.2;
        const newScale = clamp(distance / baseDistance, 0.25, 4);
        setOverlay((p) => ({ ...p, scale: newScale }));
      } else if (isRotating) {
        const centerX = (overlayRef.current.x / 100) * rect.width;
        const centerY = (overlayRef.current.y / 100) * rect.height;
        const angle = (Math.atan2(localY - centerY, localX - centerX) * 180) / Math.PI;
        setOverlay((p) => ({ ...p, rotation: angle }));
      }
    },
    [isDragging, isResizing, isRotating]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      handleMove(t.clientX, t.clientY);
    };
    const onEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsRotating(false);
    };

    if (isDragging || isResizing || isRotating) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onEnd);
      return () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onEnd);
      };
    }
    return;
  }, [isDragging, isResizing, isRotating, handleMove]);

  // Reset overlay
  const resetOverlay = () => {
    setOverlay({ x: 50, y: 60, scale: 1, rotation: 0, opacity: 0.95 });
  };

  // Download: draw uploaded image + overlay to canvas, then trigger download
  const downloadImage = async () => {
    if (!uploadedImage) {
      alert("Please upload an image first.");
      return;
    }
    const canvas = canvasRef.current ?? document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      alert("Canvas context unavailable.");
      return;
    }

    try {
      // Load base uploaded image
      const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        // uploadedImage is usually a data URL (same-origin), so no crossOrigin needed
        i.src = uploadedImage;
      });

      canvas.width = baseImg.width;
      canvas.height = baseImg.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Load overlay image from public (same origin)
      const overlayImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        i.src = OVERLAY_PUBLIC_PATH;
      });

      // Compute draw size keeping aspect ratio
      const baseSize = Math.min(canvas.width, canvas.height) * 0.32;
      const drawW = baseSize * overlay.scale;
      const aspect = overlayImg.width / overlayImg.height;
      const drawH = drawW / aspect;

      const centerX = (overlay.x / 100) * canvas.width;
      const centerY = (overlay.y / 100) * canvas.height;

      ctx.save();
      ctx.globalAlpha = overlay.opacity;
      ctx.translate(centerX, centerY);
      ctx.rotate((overlay.rotation * Math.PI) / 180);
      ctx.drawImage(overlayImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "aztec-gold-chain.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert(
        "Export failed. Ensure /aztec-chain.png exists in public/ (same origin). " +
          "Check console for details."
      );
    }
  };

  // Simple UI helpers for small adjustments
  const bumpScale = (delta: number) => setOverlay((p) => ({ ...p, scale: clamp(p.scale + delta, 0.2, 4) }));
  const bumpRotation = (delta: number) =>
    setOverlay((p) => ({ ...p, rotation: Math.round((p.rotation + delta) % 360) }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#715ec2] to-purple-600 opacity-90" />
        <div className="relative z-10 container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Triangle className="w-8 h-8 text-[#715ec2]" />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-wider">
                AZTEC - PRIVACY PLEASE! <span className="text-sm text-gray-200 ml-2">by 0xharish</span>
              </h1>
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
            Upload a photo, position the AZTEC chain, then download the composed PNG (transparent background preserved in overlay).
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-3 text-[#715ec2]" />
              AZTEC - PRIVACY PLEASE! UPLOAD
            </h3>

            <div className="border-2 border-dashed border-[#715ec2] rounded-xl p-12 text-center relative">
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
                    onLoad={() => {
                      /* recalculation done in handlers as needed */
                    }}
                  />

                  {/* Interactive overlay */}
                  <div
                    ref={overlayDomRef}
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
                      src={OVERLAY_PUBLIC_PATH}
                      alt="AZTEC Chain"
                      className="w-32 h-32 object-contain pointer-events-none select-none"
                      draggable={false}
                    />

                    {/* Resize handle */}
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

                    {/* Rotate handle */}
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

                  {/* New image button */}
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
                  <p className="text-gray-400">Add the AZTEC chain overlay with style</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

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
                  <p className="text-sm">Drag the chain to reposition</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Maximize2 className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Resize</p>
                  <p className="text-sm">Drag the bottom-right handle to resize</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RotateCw className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Rotate</p>
                  <p className="text-sm">Drag the top-right handle to rotate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for export */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-12">
        <div className="container mx-auto px-6 py-6 flex justify-between items-center text-gray-400">
          <div className="flex items-center gap-3">
            <Triangle className="w-8 h-8 text-[#715ec2]" />
            <div className="text-white font-bold">AZTEC - PRIVACY PLEASE! by 0xharish</div>
          </div>
          <div>© {new Date().getFullYear()} AZTEC - PRIVACY PLEASE! — Made by 0xharish.</div>
        </div>
      </footer>
    </div>
  );
}
