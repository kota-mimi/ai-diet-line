"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.auth = exports.db = void 0;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const auth_1 = require("firebase/auth");
const storage_1 = require("firebase/storage");
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
// Firebase を初期化
const app = (0, app_1.initializeApp)(firebaseConfig);
// Firebase サービスを初期化
exports.db = (0, firestore_1.getFirestore)(app);
exports.auth = (0, auth_1.getAuth)(app);
exports.storage = (0, storage_1.getStorage)(app);
// 本番環境ではエミュレーター接続を無効化
// if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch (error) {
//     console.log('Firestore emulator already connected');
//   }
// }
exports.default = app;
//# sourceMappingURL=firebase.js.map