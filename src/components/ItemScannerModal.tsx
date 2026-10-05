"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  IoScanOutline,
  IoSearchOutline,
  IoBarcodeOutline,
  IoAlertCircleOutline,
  IoImageOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoCameraOutline,
  IoStopCircleOutline,
} from "react-icons/io5";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { ItemQrHelper } from "@/lib/utils/itemQrHelper";
import { itemApi } from "@/lib/api/item";

const SUPPORTED_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

export function ItemScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (scannedValue: string, matchedItem?: any) => void;
}) {
  const router = useRouter();
  const [scanInput, setScanInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      const isSmallScreen = window.innerWidth < 768;
      const isMobileAgent = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(isSmallScreen || isMobileAgent);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    if (!isMobile) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsCameraActive(true);

    setTimeout(async () => {
      try {
        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (_) {}
        }
        const html5QrCode = new Html5Qrcode("camera-reader", {
          formatsToSupport: SUPPORTED_BARCODE_FORMATS,
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
          return {
            width: Math.min(360, Math.floor(viewfinderWidth * 0.9)),
            height: Math.min(220, Math.floor(viewfinderHeight * 0.6)),
          };
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: qrboxFunction,
            aspectRatio: 1.777778,
            videoConstraints: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
          },
          async (decodedText) => {
            try {
              await html5QrCode.stop();
              html5QrCodeRef.current = null;
              setIsCameraActive(false);
            } catch (_) {}
            setScanInput(decodedText);
            await processScannedValue(decodedText);
          },
          () => {
            // Ignore frame scan errors
          }
        );
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        setIsCameraActive(false);
        setErrorMsg("Could not access camera. Please grant camera permission or use image upload.");
      }
    }, 150);
  };

  const processScannedValue = async (rawScanned: string) => {
    const raw = ItemQrHelper.lookupValue(rawScanned);
    if (!raw) {
      setErrorMsg("Invalid barcode or QR code format.");
      return;
    }

    setIsSearching(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const decoded = ItemQrHelper.decode(raw);
      let matchedItem: any = null;

      // 1. If decoded type is 'item', try direct item API details fetch
      if (decoded.type === "item" && decoded.value) {
        try {
          const res: any = await itemApi.getItemDetails(decoded.value);
          const itemObj = res?.body?.item || res?.body?.data || res?.body || res?.data || res?.item || res;
          if (itemObj && itemObj.id) {
            matchedItem = itemObj;
          }
        } catch (_) {}
      }

      // 2. Search across all items if not found directly
      if (!matchedItem) {
        const listRes: any = await itemApi.getItems({ silentError: true }).catch(() => null);
        const list = Array.isArray(listRes?.body)
          ? listRes.body
          : (listRes?.body?.items || listRes?.body?.data || listRes?.items || listRes?.data || []);

        const searchVal = decoded.value.toLowerCase().trim();
        const fullRaw = raw.toLowerCase().trim();

        matchedItem = (Array.isArray(list) ? list : []).find((i: any) => {
          const idStr = String(i.id || "").toLowerCase();
          const codeStr = String(i.item_code || i.itemCode || "").toLowerCase();
          const qrCodeStr = String(i.qr_code || i.qrCode || "").toLowerCase();
          const qrPayloadStr = String(i.qr_payload || i.qrPayload || "").toLowerCase();
          const nameStr = String(i.item_name || i.itemName || "").toLowerCase();

          return (
            idStr === searchVal ||
            codeStr === searchVal ||
            qrCodeStr === searchVal ||
            qrPayloadStr === fullRaw ||
            qrPayloadStr.includes(searchVal) ||
            nameStr === searchVal
          );
        });
      }

      const scannedCode = decoded.value || raw;

      if (onScanSuccess) {
        onScanSuccess(scannedCode, matchedItem);
        onClose();
        return;
      }

      if (matchedItem && matchedItem.id) {
        const name = matchedItem.item_name || matchedItem.itemName || "Item";
        setSuccessMsg(`Item Found: ${name}`);
        setTimeout(() => {
          onClose();
          router.push(`/items/${matchedItem.id}`);
        }, 500);
      } else {
        const msg = `No item found matching "${raw}"`;
        setErrorMsg(msg);
      }
    } catch (err: any) {
      console.error("Barcode lookup error:", err);
      setErrorMsg(err?.message || "Failed to lookup scanned item.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      processScannedValue(scanInput.trim());
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");
    setIsSearching(true);

    try {
      const html5QrCode = new Html5Qrcode("file-reader", {
        formatsToSupport: SUPPORTED_BARCODE_FORMATS,
        verbose: false,
      });
      const decodedText = await html5QrCode.scanFile(file, true);

      if (decodedText) {
        setScanInput(decodedText);
        await processScannedValue(decodedText);
      } else {
        setErrorMsg("No barcode or QR code detected in the uploaded image.");
      }
      try {
        html5QrCode.clear();
      } catch (_) {}
    } catch (err: any) {
      console.warn("Image file barcode scan error:", err);
      setErrorMsg("Could not detect a valid barcode or QR code in this image.");
    } finally {
      setIsSearching(false);
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanInput("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center gi-modal-overlay backdrop-blur-sm p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl gi-modal-content p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b gi-divider pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gi-badge-info flex items-center justify-center text-lg">
              <IoScanOutline />
            </div>
            <div>
              <h3 className="text-sm font-bold gi-text-primary">Scan Barcode / QR Code</h3>
              <p className="text-[11px] gi-text-secondary">
                {isMobile
                  ? "Scan via device camera, upload image or input code"
                  : "Upload image to scan or input barcode / QR code"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg cursor-pointer p-1 rounded-full transition"
          >
            ✕
          </button>
        </div>

        {/* Live Camera Scanner Box (Mobile Devices Only) */}
        {isMobile && (
          <div className="block md:hidden">
            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-indigo-500 shadow-inner flex flex-col items-center justify-center min-h-[240px]">
                  <div id="camera-reader" className="w-full h-full min-h-[240px]" />
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <IoStopCircleOutline className="text-lg" />
                  <span>Stop Camera Scanner</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                disabled={isSearching}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
              >
                <IoCameraOutline className="text-lg" />
                <span>Start Live Camera Scanner</span>
              </button>
            )}
          </div>
        )}

        {/* Manual Barcode Input */}
        <form onSubmit={handleFormSubmit} className="space-y-2 pt-1">
          <label className="block text-xs font-semibold gi-text-primary">
            Barcode / QR Code Input (Hardware Scanner / Type)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IoBarcodeOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="e.g. ITM-7K3M9P2A or 890123456789"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs gi-input focus:outline-none focus:border-indigo-500 font-medium font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !scanInput.trim()}
              className="px-4 py-2 rounded-xl gi-btn-primary text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <IoSearchOutline className="text-base" />
              <span>{isSearching ? "Searching..." : "Lookup"}</span>
            </button>
          </div>
        </form>

        {/* Upload Image Section */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSearching}
            className="w-full py-2.5 px-4 rounded-xl gi-btn-secondary border gi-divider text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs hover:border-emerald-500"
          >
            <IoCloudUploadOutline className="text-lg text-emerald-500" />
            <span>Upload Image to Scan Barcode</span>
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
          <div id="file-reader" className="hidden" />
        </div>

        {/* Success message box */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <IoCheckmarkCircleOutline className="text-lg shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error message box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <IoAlertCircleOutline className="text-lg shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

