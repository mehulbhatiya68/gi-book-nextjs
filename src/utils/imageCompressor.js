/**
 * Compresses an image file to a maximum width/height and quality
 * to prevent browser localStorage QuotaExceededError.
 */
export function compressImageFile(file, maxWidth = 300, maxHeight = 300, quality = 0.8) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight Data URL (JPEG, quality 0.8)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Specifically compresses a business logo to fit strictly within maxChars (default 255)
 * required by the backend PostgreSQL character varying(255) column schema.
 */
export function compressLogoForApi(file, maxChars = 255) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const formats = ["image/webp", "image/jpeg"];
        const dimensions = [32, 24, 16, 12, 8];
        const qualities = [0.5, 0.3, 0.1, 0.05, 0.01];

        let bestCanvas = null;

        for (const fmt of formats) {
          for (const dim of dimensions) {
            for (const q of qualities) {
              let width = img.width;
              let height = img.height;

              if (width > dim || height > dim) {
                if (width > height) {
                  height = Math.round((height * dim) / width);
                  width = dim;
                } else {
                  width = Math.round((width * dim) / height);
                  height = dim;
                }
              }

              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, width);
              canvas.height = Math.max(1, height);
              const ctx = canvas.getContext("2d");

              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              bestCanvas = { canvas, ctx };

              try {
                const dataUrl = canvas.toDataURL(fmt, q);
                if (dataUrl && dataUrl.length <= maxChars) {
                  resolve(dataUrl);
                  return;
                }
              } catch (_) {}
            }
          }
        }

        // SVG Badge fallback if raster base64 exceeds 255 chars
        try {
          let bgHex = "%232563eb";
          if (bestCanvas) {
            const p = bestCanvas.ctx.getImageData(
              Math.floor(bestCanvas.canvas.width / 2),
              Math.floor(bestCanvas.canvas.height / 2),
              1,
              1
            ).data;
            if (p) {
              const hexStr = ((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1);
              bgHex = `%23${hexStr}`;
            }
          }
          const svgDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="8" fill="${bgHex}"/><circle cx="24" cy="24" r="12" fill="%23ffffff"/></svg>`;
          if (svgDataUrl.length <= maxChars) {
            resolve(svgDataUrl);
            return;
          }
        } catch (_) {}

        resolve(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
