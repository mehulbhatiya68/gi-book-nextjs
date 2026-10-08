"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import {
  IoBarcodeOutline,
  IoCopyOutline,
  IoCheckmarkDoneOutline,
  IoDownloadOutline,
} from "react-icons/io5";
import { toast } from "react-toastify";

export function ItemBarcode({
  value,
  width = 1.8,
  height = 50,
  fontSize = 12,
  displayValue = true,
}: {
  value: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          margin: 8,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (err) {
        console.warn("JsBarcode error:", err);
      }
    }
  }, [value, width, height, fontSize, displayValue]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs my-2 overflow-x-auto select-text">
      <svg id="standalone-barcode-svg" ref={svgRef} className="max-w-full" />
    </div>
  );
}

export function ItemQr({
  value,
  size = 150,
}: {
  value: string;
  size?: number;
}) {
  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs my-2 select-text">
      <QRCodeSVG value={value} size={size} level="M" includeMargin={true} />
    </div>
  );
}

export function ItemBarcodeTagModal({
  isOpen,
  onClose,
  itemId,
  itemData,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string | number;
  itemData?: any;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawCode = String(itemData?.qrCode || itemData?.qr_code || itemData?.itemCode || itemData?.item_code || itemId || "").trim();
  const rawId = itemData?.id || itemId;
  const barcodeValue = String(itemData?.qrCode || itemData?.qr_code || itemData?.itemCode || itemData?.item_code || rawCode || rawId || "").trim();

  const handleCopy = () => {
    if (barcodeValue) {
      navigator.clipboard.writeText(barcodeValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadBarcode = () => {
    if (!barcodeValue) return;

    const svgElement = document.querySelector("#standalone-barcode-svg") as SVGSVGElement | null;
    if (!svgElement) {
      toast.error("Barcode element not found.");
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const padding = 20;
        canvas.width = (img.width || 300) + padding * 2;
        canvas.height = (img.height || 100) + padding * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding);

          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `barcode_${barcodeValue}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success("Barcode image downloaded successfully!");
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error("Barcode download error:", err);
      toast.error("Failed to download barcode image.");
    }
  };

  return (
    <motion.div key="item-barcode-tag-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4 select-none">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-2xl gi-modal-content p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b gi-divider pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gi-badge-warning flex items-center justify-center text-lg">
              <IoBarcodeOutline />
            </div>
            <div>
              <h3 className="text-sm font-bold gi-text-primary">Item Barcode</h3>
              <p className="text-[11px] gi-text-secondary font-mono truncate max-w-xs">{barcodeValue}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer p-1 rounded-full transition">
            ✕
          </button>
        </div>

        {/* Barcode Display Card */}
        <div className="p-4 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white text-slate-900 text-center space-y-2 shadow-xs">
          <div className="flex items-center justify-center py-2">
            <ItemBarcode value={barcodeValue} width={1.8} height={50} fontSize={11} />
          </div>
        </div>

        {/* Action Buttons: Copy & Download Barcode Only */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button" onClick={handleCopy} className="flex-1 py-2.5 rounded-xl border gi-divider text-xs font-semibold gi-btn-secondary flex items-center justify-center gap-1.5 cursor-pointer">
            {copied ? <IoCheckmarkDoneOutline className="text-emerald-500 text-base" /> : <IoCopyOutline className="text-base" />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>

          <button type="button" onClick={handleDownloadBarcode} className="flex-1 py-2.5 rounded-xl gi-btn-primary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
            <IoDownloadOutline className="text-base" />
            <span>Download Barcode</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
