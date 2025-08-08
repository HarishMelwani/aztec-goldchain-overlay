import React, { useRef, useState } from 'react';
import { Triangle, Upload, RotateCcw, Download } from 'lucide-react';

// Replace with your overlay PNG path
const overlayImageUrl = '/aztec-gold-chain.png';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState({
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 0.9
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Download image with overlay
  const downloadImage = () => {
    if (!uploadedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const overlayImg = new Image();
      overlayImg.crossOrigin = 'anonymous';
      overlayImg.onload = () => {
        const overlayX = (overlay.x / 100) * img.width - (overlayImg.width * overlay.scale) / 2;
        const overlayY = (overlay.y / 100) * img.height - (overlayImg.height * overlay.scale) / 2;

        ctx.save();
        ctx.globalAlpha = overlay.opacity;
        ctx.translate(overlayX + overlayImg.width / 2, overlayY + overlayImg.height / 2);
        ctx.rotate((overlay.rotation * Math.PI) / 180);
        ctx.scale(overlay.scale, overlay.scale);
        ctx.drawImage(overlayImg, -overlayImg.width / 2, -overlayImg.height / 2);
        ctx.restore();

        const link = document.createElement('a');
        link.download = 'aztec-gold-chain.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      overlayImg.src = overlayImageUrl;
    };
    img.src = uploadedImage;
  };

  // Reset overlay
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
                  
                  {/* Overlay */}
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
                  >
                    <img 
                      src={overlayImageUrl}
                      alt="AZTEC Chain"
                      className="w-32 h-32 object-contain pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-white">Upload an image to get started</p>
              )}
            </div>

            <div className="flex justify-center space-x-4 mt-6">
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

        {/* Hidden Canvas for Download */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>
    </div>
  );
}

export default App;
