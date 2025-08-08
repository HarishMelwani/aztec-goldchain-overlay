import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RotateCcw, Triangle, Move, RotateCw, Maximize2 } from 'lucide-react';

interface OverlayState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

function App() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayState>({
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 0.9
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageContainer, setImageContainer] = useState<DOMRect | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const overlayImageUrl = 'https://i.ibb.co/tpnJF7JH/Chat-GPT-Image-Aug-8-2025-02-00-46-PM.png';

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        // Reset overlay position when new image is uploaded
        setOverlay({
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0,
          opacity: 0.9
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateImageContainer = useCallback(() => {
    if (imageContainerRef.current) {
      setImageContainer(imageContainerRef.current.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    updateImageContainer();
    window.addEventListener('resize', updateImageContainer);
    return () => window.removeEventListener('resize', updateImageContainer);
  }, [updateImageContainer, uploadedImage]);

  const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize' | 'rotate') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    if (action === 'drag') setIsDragging(true);
    else if (action === 'resize') setIsResizing(true);
    else if (action === 'rotate') setIsRotating(true);
  };

  const handleTouchStart = (e: React.TouchEvent, action: 'drag' | 'resize' | 'rotate') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });

    if (action === 'drag') setIsDragging(true);
    else if (action === 'resize') setIsResizing(true);
    else if (action === 'rotate') setIsRotating(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!imageContainer || (!isDragging && !isResizing && !isRotating)) return;

    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, (currentY / rect.height) * 100));
      
      setOverlay(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing) {
      const centerX = rect.width * overlay.x / 100;
      const centerY = rect.height * overlay.y / 100;
      const distance = Math.sqrt(
        Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
      );
      const baseDistance = Math.min(rect.width, rect.height) * 0.2;
      const newScale = Math.max(0.3, Math.min(3, distance / baseDistance));
      
      setOverlay(prev => ({
        ...prev,
        scale: newScale
      }));
    } else if (isRotating) {
      const centerX = rect.width * overlay.x / 100;
      const centerY = rect.height * overlay.y / 100;
      const angle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
      
      setOverlay(prev => ({
        ...prev,
        rotation: angle
      }));
    }
  }, [isDragging, isResizing, isRotating, imageContainer, overlay.x, overlay.y]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!imageContainer || (!isDragging && !isResizing && !isRotating)) return;

    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = e.touches[0];
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    if (isDragging) {
      const newX = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
      const newY = Math.max(0, Math.min(100, (currentY / rect.height) * 100));
      
      setOverlay(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing) {
      const centerX = rect.width * overlay.x / 100;
      const centerY = rect.height * overlay.y / 100;
      const distance = Math.sqrt(
        Math.pow(currentX - centerX, 2) + Math.pow(currentY - centerY, 2)
      );
      const baseDistance = Math.min(rect.width, rect.height) * 0.2;
      const newScale = Math.max(0.3, Math.min(3, distance / baseDistance));
      
      setOverlay(prev => ({
        ...prev,
        scale: newScale
      }));
    } else if (isRotating) {
      const centerX = rect.width * overlay.x / 100;
      const centerY = rect.height * overlay.y / 100;
      const angle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
      
      setOverlay(prev => ({
        ...prev,
        rotation: angle
      }));
    }
  }, [isDragging, isResizing, isRotating, imageContainer, overlay.x, overlay.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleTouchMove, handleMouseUp]);

  const downloadImage = () => {
    if (!canvasRef.current || !uploadedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the uploaded image
      ctx.drawImage(img, 0, 0);
      
      // Draw the overlay
      const overlayImg = new Image();
      overlayImg.onload = () => {
        ctx.save();
        
        const overlaySize = Math.min(img.width, img.height) * 0.3 * overlay.scale;
        const x = (img.width * overlay.x / 100);
        const y = (img.height * overlay.y / 100);
        
        ctx.globalAlpha = overlay.opacity;
        ctx.translate(x, y);
        ctx.rotate(overlay.rotation * Math.PI / 180);
        ctx.drawImage(overlayImg, -overlaySize/2, -overlaySize/2, overlaySize, overlaySize);
        
        ctx.restore();
        
        // Download the image
        const link = document.createElement('a');
        link.download = 'https://i.ibb.co/tpnJF7JH/Chat-GPT-Image-Aug-8-2025-02-00-46-PM.png';
        link.href = canvas.toDataURL();
        link.click();
      };
      overlayImg.src = overlayImageUrl;
    };
    img.src = uploadedImage;
  };

  const resetOverlay = () => {
    setOverlay({
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 0.9
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#715ec2] to-purple-600 opacity-90"></div>
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            AZTEC - PRIVACY PLEASE! <span className="text-[#715ec2]">CHAIN OVERLAY</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Add the iconic AZTEC - PRIVACY PLEASE! gold chain to your images. Drag, resize, and rotate with intuitive controls.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
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
                  style={{ userSelect: 'none' }}
                >
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-w-full max-h-96 rounded-lg shadow-lg"
                    draggable={false}
                  />
                  
                  {/* Interactive Overlay */}
                  <div
                    ref={overlayRef}
                    className="absolute pointer-events-auto cursor-move"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: `translate(-50%, -50%) scale(${overlay.scale}) rotate(${overlay.rotation}deg)`,
                      opacity: overlay.opacity,
                      zIndex: 10
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'drag')}
                    onTouchStart={(e) => handleTouchStart(e, 'drag')}
                  >
                    <img 
                      src={overlayImageUrl}
                      alt="AZTEC - PRIVACY PLEASE! Chain"
                      className="w-32 h-32 object-contain pointer-events-none"
                      draggable={false}
                    />
                    
                    {/* Control Handles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Resize Handle */}
                      <div
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#715ec2] rounded-full border-2 border-white cursor-nw-resize pointer-events-auto hover:bg-purple-600 transition-colors flex items-center justify-center"
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        onTouchStart={(e) => handleTouchStart(e, 'resize')}
                      >
                        <Maximize2 className="w-3 h-3 text-white" />
                      </div>
                      
                      {/* Rotation Handle */}
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#715ec2] rounded-full border-2 border-white cursor-grab pointer-events-auto hover:bg-purple-600 transition-colors flex items-center justify-center"
                        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                        onTouchStart={(e) => handleTouchStart(e, 'rotate')}
                      >
                        <RotateCw className="w-3 h-3 text-white" />
                      </div>
                      
                      {/* Move Handle */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#715ec2] rounded-full border-2 border-white pointer-events-auto hover:bg-purple-600 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Move className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload New Image Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 bg-[#715ec2] hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center z-20"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    New Image
                  </button>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-16 h-16 text-[#715ec2] mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Click to upload your image</p>
                  <p className="text-gray-400">Add the AZTEC - PRIVACY PLEASE! chain overlay with style</p>
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
          </div>

          {/* Quick Controls */}
          {uploadedImage && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-white font-semibold">Opacity:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={overlay.opacity}
                    onChange={(e) => setOverlay(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                    className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-[#715ec2] text-sm">{Math.round(overlay.opacity * 100)}%</span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={resetOverlay}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                  <button
                    onClick={downloadImage}
                    className="bg-[#715ec2] hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download AZTEC - PRIVACY PLEASE!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">How to use AZTEC - PRIVACY PLEASE! Overlay:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-gray-300">
              <div className="flex items-start space-x-3">
                <Move className="w-5 h-5 text-[#715ec2] mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">Move</p>
                  <p className="text-sm">Drag the AZTEC - PRIVACY PLEASE! chain to reposition</p>
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
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Triangle className="w-8 h-8 text-[#715ec2]" />
              <span className="text-2xl font-bold text-white">AZTEC - PRIVACY PLEASE!</span>
            </div>
            <div className="text-gray-400">
              © 2025 AZTEC - PRIVACY PLEASE!. Add the chain, make it reign.
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

export default App;