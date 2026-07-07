// ---------------------------------------------------------------------------
// Utilidades de imagem. Convertem um arquivo em data URL (base64) para
// persistir no IndexedDB. Redimensiona para não estourar o armazenamento do
// navegador (thumbnails de anúncio não precisam ser gigantes).
// ---------------------------------------------------------------------------

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Lê o arquivo, redimensiona para caber em maxSize (lado maior) e devolve um
 * JPEG/PNG em data URL. Mantém a proporção. Se algo falhar, cai no dataURL cru.
 */
export async function fileToResizedDataUrl(
  file: File,
  maxSize = 800,
  quality = 0.82,
): Promise<string> {
  const raw = await fileToDataUrl(file);
  try {
    const img = await loadImage(raw);
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale >= 1) return raw; // já é pequena o bastante
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNG mantém transparência; o resto vira JPEG (bem menor).
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    return canvas.toDataURL(type, quality);
  } catch {
    return raw;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Extrai o primeiro arquivo de imagem de um evento de drop. */
export function imageFileFromDrop(e: React.DragEvent): File | null {
  const files = Array.from(e.dataTransfer?.files ?? []);
  return files.find((f) => f.type.startsWith("image/")) ?? null;
}
