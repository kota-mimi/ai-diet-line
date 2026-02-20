"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
// Firebase Admin初期化関数
function initializeFirebaseAdmin() {
    if ((0, app_1.getApps)().length) {
        return; // 既に初期化済み
    }
    try {
        console.log('🔧 Firebase Admin初期化開始...');
        // 環境変数から認証情報を取得
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'healthy-kun';
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@healthy-kun.iam.gserviceaccount.com';
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // 本番環境でのみ詳細ログを出力
        if (process.env.NODE_ENV === 'production') {
            console.log('🔍 本番環境 Firebase設定確認:');
            console.log('  - projectId:', projectId);
            console.log('  - clientEmail:', clientEmail ? '設定済み' : '未設定');
            console.log('  - privateKey:', privateKey ? '設定済み' : '未設定');
        }
        // 開発環境またはビルド時で適切な秘密鍵がない場合は初期化をスキップ
        if (!clientEmail || !privateKey || privateKey.includes('Example')) {
            console.log('🔧 Firebase Admin SDK初期化をスキップ（認証情報不足）');
            return;
        }
        // Private Key の改行文字を正しく処理
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        // Storage bucket設定
        const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
        console.log('🔧 Firebase設定:', {
            projectId,
            storageBucket,
            clientEmail: clientEmail ? 'present' : 'missing'
        });
        // 認証情報で初期化
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId,
                clientEmail,
                privateKey: formattedPrivateKey,
            }),
            projectId,
            storageBucket,
        });
        if (process.env.NODE_ENV === 'production') {
            console.log('✅ Firebase Admin初期化成功');
        }
    }
    catch (error) {
        console.error('❌ Firebase admin initialization error:', error);
        // 開発環境ではエラーを無視
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 開発環境：Firebase Admin初期化エラーを無視');
            return;
        }
        throw error; // 本番環境ではエラーを再スロー
    }
}
// 初期化を実行
initializeFirebaseAdmin();
// Firestoreインスタンスを格納する変数
let firestoreInstance = null;
// 初期化が完了した後にFirestoreインスタンスを取得
try {
    if ((0, app_1.getApps)().length > 0) {
        firestoreInstance = (0, firestore_1.getFirestore)();
    }
}
catch (error) {
    console.log('🔧 Firestore初期化時エラー:', error);
}
exports.admin = {
    firestore: () => {
        try {
            if (!firestoreInstance) {
                if ((0, app_1.getApps)().length === 0) {
                    throw new Error('Firebase Admin app not initialized');
                }
                firestoreInstance = (0, firestore_1.getFirestore)();
            }
            return firestoreInstance;
        }
        catch (error) {
            console.error('❌ Firestore取得エラー:', error);
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 開発環境：Firestoreエラーを無視（ダミーオブジェクトを返却）');
                // 開発環境用のダミーオブジェクトを返却
                return {
                    collection: () => ({
                        doc: () => ({
                            get: () => Promise.resolve({ exists: false, data: () => null }),
                            set: () => Promise.resolve(),
                            update: () => Promise.resolve(),
                            delete: () => Promise.resolve(),
                            collection: () => ({
                                doc: () => ({
                                    get: () => Promise.resolve({ exists: false, data: () => null }),
                                    set: () => Promise.resolve(),
                                })
                            })
                        })
                    })
                };
            }
            throw error;
        }
    },
    storage: () => {
        try {
            if ((0, app_1.getApps)().length === 0) {
                throw new Error('Firebase Admin app not initialized');
            }
            const storage = (0, storage_1.getStorage)();
            console.log('✅ Firebase Storage取得成功');
            return storage;
        }
        catch (error) {
            console.error('❌ Firebase Storage取得エラー:', error);
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 開発環境：Storage エラーを無視');
                return null;
            }
            throw error;
        }
    },
    FieldValue: firestore_1.FieldValue,
    FieldPath: firestore_1.FieldPath,
};
//# sourceMappingURL=firebase-admin.js.map