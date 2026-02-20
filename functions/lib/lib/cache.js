"use strict";
/**
 * シンプルなメモリキャッシュ実装
 * Firebase API呼び出しを削減してコスト最適化
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheKey = exports.apiCache = exports.CACHE_TTL = void 0;
// 🚀 データ種別に応じた最適なキャッシュTTL（コスト削減）
exports.CACHE_TTL = {
    // 頻繁に変更されないデータ（長時間キャッシュ）
    PROFILE: 24 * 60 * 60 * 1000, // 24時間（プロフィールデータ）
    COUNSELING: 24 * 60 * 60 * 1000, // 24時間（カウンセリング結果）
    // 日次データ（中程度キャッシュ）
    MEALS: 30 * 60 * 1000, // 30分（食事データ）
    WEIGHT: 30 * 60 * 1000, // 30分（体重データ）
    EXERCISE: 30 * 60 * 1000, // 30分（運動データ）
    // リアルタイムデータ（短時間キャッシュ）
    FEEDBACK: 15 * 60 * 1000, // 15分（フィードバックデータ）
    DASHBOARD: 15 * 60 * 1000, // 15分（統合ダッシュボードデータ）
    // デフォルト（従来の5分）
    DEFAULT: 5 * 60 * 1000 // 5分（その他）
};
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }
    /**
     * キャッシュからデータを取得
     */
    get(key) {
        const item = this.cache.get(key);
        if (item && Date.now() < item.expires) {
            return item.data;
        }
        if (item) {
            this.cache.delete(key);
        }
        else {
        }
        return null;
    }
    /**
     * データをキャッシュに保存
     * @param key キャッシュキー
     * @param data 保存するデータ
     * @param ttlMs 有効期限（ミリ秒）デフォルト5分
     */
    set(key, data, ttlMs = exports.CACHE_TTL.DEFAULT) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttlMs
        });
    }
    /**
     * 特定のキーのキャッシュを削除
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * 全キャッシュをクリア
     */
    clear() {
        this.cache.clear();
    }
    /**
     * キャッシュの状態を確認
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * 期限切れのキャッシュを自動削除
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now >= item.expires) {
                this.cache.delete(key);
            }
        }
    }
}
// グローバルキャッシュインスタンス
exports.apiCache = new SimpleCache();
// 定期的なクリーンアップ（5分毎）
if (typeof window !== 'undefined') {
    setInterval(() => {
        exports.apiCache.cleanup();
    }, 5 * 60 * 1000);
}
/**
 * キャッシュキー生成ヘルパー
 */
const createCacheKey = (...parts) => {
    return parts.filter(Boolean).join('_');
};
exports.createCacheKey = createCacheKey;
//# sourceMappingURL=cache.js.map