"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveProfileHistory = saveProfileHistory;
exports.getProfileForDate = getProfileForDate;
exports.getLatestProfile = getLatestProfile;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const calculations_1 = require("../utils/calculations");
// プロフィール変更を履歴として保存
async function saveProfileHistory(userId, profileData) {
    try {
        const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
        console.log('📊 プロフィール履歴保存開始:', {
            userId,
            profileData,
            changeDate
        });
        // プロフィールをUserProfile型に変換
        const profile = {
            name: profileData.name,
            age: profileData.age,
            gender: profileData.gender,
            height: profileData.height,
            weight: profileData.weight,
            targetWeight: profileData.targetWeight,
            activityLevel: profileData.activityLevel,
            goals: [{
                    type: profileData.primaryGoal,
                    targetValue: profileData.targetWeight
                }],
            sleepDuration: '8h_plus', // デフォルト値
            sleepQuality: 'normal',
            exerciseHabit: 'yes',
            exerciseFrequency: 'weekly_3_4',
            mealFrequency: '3',
            snackFrequency: 'sometimes',
            alcoholFrequency: 'none'
        };
        console.log('📊 プロフィール変換完了:', profile);
        // カロリーと栄養計算
        const goals = [{
                type: profileData.primaryGoal,
                targetValue: profileData.targetWeight
            }];
        const targetCalories = (0, calculations_1.calculateCalorieTarget)(profile, goals);
        const macros = (0, calculations_1.calculateMacroTargets)(targetCalories);
        const bmr = (0, calculations_1.calculateBMR)(profile);
        const tdee = (0, calculations_1.calculateTDEE)(bmr, profileData.activityLevel);
        console.log('📊 計算結果:', {
            targetCalories,
            macros,
            bmr,
            tdee
        });
        const historyEntry = Object.assign(Object.assign({}, profileData), { changeDate,
            targetCalories,
            bmr,
            tdee,
            macros });
        console.log('📊 履歴エントリ作成:', historyEntry);
        // プロフィール履歴をサブコレクションに保存（食事記録と同じパターン）
        const profileHistoryRef = (0, firestore_1.doc)(firebase_1.db, 'users', userId, 'profileHistory', changeDate);
        console.log('📊 プロフィール履歴サブコレクションに保存:', `users/${userId}/profileHistory/${changeDate}`);
        await (0, firestore_1.setDoc)(profileHistoryRef, historyEntry);
        // メインユーザードキュメントの最終更新日も更新
        const userDocRef = (0, firestore_1.doc)(firebase_1.db, 'users', userId);
        await (0, firestore_1.updateDoc)(userDocRef, {
            lastProfileUpdate: new Date().toISOString()
        });
        console.log('✅ プロフィール履歴保存完了:', historyEntry);
    }
    catch (error) {
        console.error('❌ プロフィール履歴保存エラー詳細:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorName: error instanceof Error ? error.name : 'Unknown',
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            userId
        });
        throw error;
    }
}
// 指定日付に有効なプロフィールデータを取得
async function getProfileForDate(userId, targetDate) {
    try {
        // サブコレクションからプロフィール履歴を取得
        const profileHistoryRef = (0, firestore_1.collection)(firebase_1.db, 'users', userId, 'profileHistory');
        const q = (0, firestore_1.query)(profileHistoryRef, (0, firestore_1.where)('changeDate', '<=', targetDate), (0, firestore_1.orderBy)('changeDate', 'desc'));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty) {
            return null;
        }
        // 最も新しいプロフィールを返す
        const doc = querySnapshot.docs[0];
        return doc.data();
    }
    catch (error) {
        console.error('❌ プロフィール取得エラー:', error);
        return null;
    }
}
// 最新のプロフィールデータを取得
async function getLatestProfile(userId) {
    try {
        // サブコレクションから最新のプロフィール履歴を取得
        const profileHistoryRef = (0, firestore_1.collection)(firebase_1.db, 'users', userId, 'profileHistory');
        const q = (0, firestore_1.query)(profileHistoryRef, (0, firestore_1.orderBy)('changeDate', 'desc'));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty) {
            return null;
        }
        // 最も新しいプロフィールを返す
        const doc = querySnapshot.docs[0];
        return doc.data();
    }
    catch (error) {
        console.error('❌ 最新プロフィール取得エラー:', error);
        return null;
    }
}
//# sourceMappingURL=profileHistory.js.map