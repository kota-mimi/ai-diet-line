"use strict";
/**
 * 画像圧縮ユーティリティ
 * localStorageに保存できるサイズまで画像を圧縮
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressImage = compressImage;
exports.getImageSizeKB = getImageSizeKB;
exports.canStoreInLocalStorage = canStoreInLocalStorage;
/**
 * 画像ファイルを圧縮してbase64文字列を返す
 */
function compressImage(file, options = {}) {
    const { maxWidth = 800, maxHeight = 800, quality = 0.8, maxSizeKB = 1000 // 1MB制限
     } = options;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            var _a;
            const img = new Image();
            img.onload = () => {
                // canvasで画像をリサイズ
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }
                // アスペクト比を保持してリサイズ
                const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                // 画像を描画
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // 品質を調整しながら圧縮
                let currentQuality = quality;
                let compressedDataUrl;
                const compress = () => {
                    compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
                    // サイズチェック（base64の場合、実際のサイズは約3/4）
                    const sizeKB = (compressedDataUrl.length * 3) / (4 * 1024);
                    if (sizeKB > maxSizeKB && currentQuality > 0.1) {
                        // まだ大きすぎる場合は品質を下げて再圧縮
                        currentQuality -= 0.1;
                        compress();
                    }
                    else {
                        resolve(compressedDataUrl);
                    }
                };
                compress();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
/**
 * base64画像データのサイズを計算（KB）
 */
function getImageSizeKB(base64Data) {
    return (base64Data.length * 3) / (4 * 1024);
}
/**
 * 画像データがlocalStorageに保存可能かチェック
 */
function canStoreInLocalStorage(base64Data) {
    return getImageSizeKB(base64Data) <= 1000; // 1MB制限
}
//# sourceMappingURL=imageUtils.js.map