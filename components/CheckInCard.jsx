import React, { useEffect, useRef, useState } from "react";
import { Camera, Download, X, Zap } from "lucide-react";

export default function CheckInCard({ menuTitle, onClose, onGainXP }) {
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      if (!xpAwarded && onGainXP) {
        onGainXP(10);
        setXpAwarded(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      const width = 1080;
      const height = 1440;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#f5f5f4";
      ctx.fillRect(0, 0, width, height);

      const padding = 60;
      const imgSize = width - padding * 2;

      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;

      let sourceX, sourceY, sourceW, sourceH;
      if (img.width / img.height > 1) {
        sourceH = img.height;
        sourceW = img.height;
        sourceX = (img.width - img.height) / 2;
        sourceY = 0;
      } else {
        sourceW = img.width;
        sourceH = img.width;
        sourceX = 0;
        sourceY = (img.height - img.width) / 2;
      }

      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, padding, padding + 100, imgSize, imgSize);
      ctx.shadowColor = "transparent";

      ctx.textAlign = "center";

      ctx.font = 'bold 50px "Noto Serif SC", serif';
      ctx.fillStyle = "#78350f";
      ctx.fillText("绝世食谱 · 每日一练", width / 2, 80);

      ctx.font = 'bold 90px "Noto Serif SC", serif';
      ctx.fillStyle = "#1c1917";
      ctx.fillText(menuTitle || "今日修炼", width / 2, height - 180);

      const date = new Date();
      const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      ctx.font = "40px sans-serif";
      ctx.fillStyle = "#78716c";
      ctx.fillText(dateStr, width / 2, height - 100);

      // 红章
      ctx.save();
      ctx.translate(width - 180, height - 180);
      ctx.rotate((-15 * Math.PI) / 180);
      ctx.strokeStyle = "rgba(220, 38, 38, 0.8)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(0, 0, 120, 120, 10);
      ctx.stroke();
      ctx.font = 'bold 30px "Noto Serif SC", serif';
      ctx.fillStyle = "#dc2626";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("厨神", 60, 45);
      ctx.fillText("认证", 60, 85);
      ctx.restore();
    };
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `绝世食谱_${menuTitle || "打卡"}_打卡.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.8);
    link.click();
  };

  useEffect(() => {
    if (imageSrc) drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  return (
    <div className="fixed inset-0 z-[70] bg-stone-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg flex flex-col h-full max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Camera className="text-amber-500" /> 厨神打卡
          </h2>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-stone-800 rounded-2xl p-4 flex flex-col items-center justify-center overflow-hidden relative border border-white/10">
          {!imageSrc ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/20">
                <Camera size={40} className="text-white/50" />
              </div>
              <p className="text-stone-400">
                拍摄或上传您的完成图
                <br />
                生成专属打卡海报
              </p>
              <label className="inline-block bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                选择图片
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar flex items-center justify-center bg-stone-900/50 rounded-lg mb-4 relative">
                <canvas ref={canvasRef} className="max-h-full max-w-full shadow-2xl rounded-sm" />
                {xpAwarded && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-stone-900 px-4 py-2 rounded-full font-bold shadow-lg animate-bounce flex items-center gap-2 z-10">
                    <Zap size={16} fill="currentColor" /> 经验 +10
                  </div>
                )}
              </div>

              <div className="flex gap-3 shrink-0">
                <label className="flex-1 bg-stone-700 text-white py-3 rounded-xl font-bold text-center cursor-pointer hover:bg-stone-600">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  重拍
                </label>
                <button
                  onClick={downloadImage}
                  className="flex-[2] bg-amber-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-500 shadow-lg shadow-amber-900/20"
                >
                  <Download size={20} /> 保存海报 (JPG)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
