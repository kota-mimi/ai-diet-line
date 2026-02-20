"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreService = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../lib/firebase");
const utils_1 = require("../lib/utils");
class FirestoreService {
    // ユーザー情報の保存
    async saveUser(lineUserId, userData) {
        try {
            const userRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId);
            await (0, firestore_1.setDoc)(userRef, Object.assign(Object.assign({}, userData), { lineUserId, updatedAt: (0, firestore_1.serverTimestamp)(), createdAt: userData.createdAt || (0, firestore_1.serverTimestamp)() }), { merge: true });
            return true;
        }
        catch (error) {
            console.error('ユーザー情報保存エラー:', error);
            throw error;
        }
    }
    // ユーザー情報の取得
    async getUser(lineUserId) {
        var _a, _b;
        try {
            const userRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId);
            const userSnap = await (0, firestore_1.getDoc)(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                return Object.assign(Object.assign({}, data), { userId: userSnap.id, createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(), updatedAt: ((_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate()) || new Date() });
            }
            return null;
        }
        catch (error) {
            console.error('ユーザー情報取得エラー:', error);
            throw error;
        }
    }
    // カウンセリング結果の保存
    async saveCounselingResult(lineUserId, answers, aiAnalysis) {
        try {
            const counselingRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'counseling', 'result');
            // 既存のカウンセリング結果を確認
            const existingDoc = await (0, firestore_1.getDoc)(counselingRef);
            const existingData = existingDoc.exists() ? existingDoc.data() : null;
            // firstCompletedAtを設定（初回のみ）
            const firstCompletedAt = (existingData === null || existingData === void 0 ? void 0 : existingData.firstCompletedAt) || (0, firestore_1.serverTimestamp)();
            await (0, firestore_1.setDoc)(counselingRef, {
                answers,
                aiAnalysis,
                completedAt: (0, firestore_1.serverTimestamp)(),
                createdAt: (existingData === null || existingData === void 0 ? void 0 : existingData.createdAt) || (0, firestore_1.serverTimestamp)(),
                firstCompletedAt, // 最初のカウンセリング完了日を保持
            });
            // ユーザープロファイルも更新（undefined値の処理）
            const profile = {
                name: answers.name || 'ユーザー',
                age: Number(answers.age) || 25,
                gender: answers.gender || 'other',
                height: Number(answers.height) || 170,
                weight: Number(answers.weight) || 60,
                activityLevel: answers.activityLevel || 'normal',
                goals: [{
                        type: answers.primaryGoal || 'fitness_improve',
                        targetValue: Number(answers.targetWeight) || Number(answers.weight) || 60,
                    }],
                medicalConditions: answers.medicalConditions || '',
                allergies: answers.allergies || '',
                sleepDuration: answers.sleepDuration || '6_7h',
                sleepQuality: answers.sleepQuality || 'normal',
                exerciseHabit: answers.exerciseHabit || 'no',
                exerciseFrequency: answers.exerciseFrequency || 'none',
                mealFrequency: answers.mealFrequency || '3',
                snackFrequency: answers.snackFrequency || 'sometimes',
                alcoholFrequency: answers.alcoholFrequency || 'none'
            };
            await this.saveUser(lineUserId, { profile });
            return true;
        }
        catch (error) {
            console.error('カウンセリング結果保存エラー:', error);
            throw error;
        }
    }
    // カウンセリング結果の取得
    async getCounselingResult(lineUserId) {
        var _a, _b;
        try {
            const counselingRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'counseling', 'result');
            const counselingSnap = await (0, firestore_1.getDoc)(counselingRef);
            if (counselingSnap.exists()) {
                const data = counselingSnap.data();
                return Object.assign(Object.assign({}, data), { completedAt: (_a = data.completedAt) === null || _a === void 0 ? void 0 : _a.toDate(), createdAt: (_b = data.createdAt) === null || _b === void 0 ? void 0 : _b.toDate() });
            }
            return null;
        }
        catch (error) {
            console.error('カウンセリング結果取得エラー:', error);
            throw error;
        }
    }
    // 日次記録の保存
    async saveDailyRecord(lineUserId, date, recordData) {
        try {
            const recordRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'dailyRecords', date);
            await (0, firestore_1.setDoc)(recordRef, Object.assign(Object.assign({}, recordData), { date,
                lineUserId, updatedAt: (0, firestore_1.serverTimestamp)(), createdAt: recordData.createdAt || (0, firestore_1.serverTimestamp)() }), { merge: true });
            return true;
        }
        catch (error) {
            console.error('日次記録保存エラー:', error);
            throw error;
        }
    }
    // 日次記録の取得
    async getDailyRecord(lineUserId, date) {
        var _a, _b;
        try {
            const recordRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'dailyRecords', date);
            const recordSnap = await (0, firestore_1.getDoc)(recordRef);
            if (recordSnap.exists()) {
                const data = recordSnap.data();
                // Migration: Handle both old 'exercise' and new 'exercises' field names
                let exercises = data.exercises;
                if (!exercises && data.exercise) {
                    exercises = data.exercise;
                    // Update the data to use the new field name
                    data.exercises = exercises;
                    delete data.exercise;
                    // Save the migrated data to Firestore to make it permanent
                    try {
                        await (0, firestore_1.setDoc)(recordRef, Object.assign(Object.assign({}, data), { updatedAt: (0, firestore_1.serverTimestamp)() }));
                    }
                    catch (migrationError) {
                        console.error('🔄 FirestoreService migration save error:', migrationError);
                    }
                }
                if (exercises && exercises.length > 0) {
                }
                return Object.assign(Object.assign({}, data), { createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date(), updatedAt: ((_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate()) || new Date() });
            }
            return null;
        }
        catch (error) {
            console.error('日次記録取得エラー:', error);
            throw error;
        }
    }
    // 期間の記録を取得（レポート用）
    async getDailyRecordsRange(lineUserId, startDate, endDate) {
        try {
            const recordsRef = (0, firestore_1.collection)(firebase_1.db, 'users', lineUserId, 'dailyRecords');
            const q = (0, firestore_1.query)(recordsRef, (0, firestore_1.where)('date', '>=', startDate), (0, firestore_1.where)('date', '<=', endDate), (0, firestore_1.orderBy)('date', 'desc'));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            const records = querySnapshot.docs.map(doc => {
                var _a, _b;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate(), updatedAt: (_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toDate() }));
            });
            return records;
        }
        catch (error) {
            console.error('期間記録取得エラー:', error);
            throw error;
        }
    }
    // 食事記録の追加
    async addMeal(lineUserId, date, mealData) {
        try {
            // 既存の日次記録を取得
            const existingRecord = await this.getDailyRecord(lineUserId, date);
            const meals = (existingRecord === null || existingRecord === void 0 ? void 0 : existingRecord.meals) || [];
            // 新しい食事を追加
            meals.push(Object.assign(Object.assign({}, mealData), { id: `meal_${(0, utils_1.generateId)()}`, timestamp: new Date() }));
            // 日次記録を更新
            await this.saveDailyRecord(lineUserId, date, {
                meals,
            });
            return true;
        }
        catch (error) {
            console.error('食事記録追加エラー:', error);
            throw error;
        }
    }
    // 運動記録の追加
    async addExercise(lineUserId, date, exerciseData) {
        try {
            const existingRecord = await this.getDailyRecord(lineUserId, date);
            const exercises = (existingRecord === null || existingRecord === void 0 ? void 0 : existingRecord.exercise) || [];
            const newExercise = Object.assign(Object.assign({}, exerciseData), { id: `exercise_${(0, utils_1.generateId)()}`, timestamp: new Date() });
            exercises.push(newExercise);
            const saveData = {
                exercise: exercises,
            };
            await this.saveDailyRecord(lineUserId, date, saveData);
            return true;
        }
        catch (error) {
            console.error('運動記録追加エラー:', error);
            throw error;
        }
    }
    // 体重記録の更新
    async updateWeight(lineUserId, date, weight) {
        try {
            await this.saveDailyRecord(lineUserId, date, {
                weight,
            });
            // ユーザープロファイルの体重も更新
            const user = await this.getUser(lineUserId);
            if (user && user.profile) {
                user.profile.weight = weight;
                await this.saveUser(lineUserId, { profile: user.profile });
            }
            return true;
        }
        catch (error) {
            console.error('体重記録更新エラー:', error);
            throw error;
        }
    }
    // 食事記録の削除
    async deleteMeal(lineUserId, date, mealType, mealId) {
        try {
            // 既存の日次記録を取得
            const existingRecord = await this.getDailyRecord(lineUserId, date);
            if (!existingRecord || !existingRecord.meals) {
                throw new Error('食事記録が見つかりません');
            }
            // 指定されたmealIdの食事を除外
            const updatedMeals = existingRecord.meals.filter((meal) => meal.id !== mealId);
            // 日次記録を更新
            await this.saveDailyRecord(lineUserId, date, {
                meals: updatedMeals,
            });
            return true;
        }
        catch (error) {
            console.error('食事記録削除エラー:', error);
            throw error;
        }
    }
    // プロフィール履歴の保存
    async saveProfileHistory(lineUserId, profileData) {
        try {
            const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
            const profileHistoryRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'profileHistory', changeDate);
            await (0, firestore_1.setDoc)(profileHistoryRef, Object.assign(Object.assign({}, profileData), { changeDate, updatedAt: (0, firestore_1.serverTimestamp)(), createdAt: (0, firestore_1.serverTimestamp)() }));
            // メインユーザードキュメントの最終更新日も更新
            const userDocRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId);
            await (0, firestore_1.updateDoc)(userDocRef, {
                lastProfileUpdate: (0, firestore_1.serverTimestamp)()
            });
            return true;
        }
        catch (error) {
            console.error('プロフィール履歴保存エラー:', error);
            throw error;
        }
    }
    // プロフィール履歴の取得
    async getProfileHistory(lineUserId, targetDate) {
        try {
            if (targetDate) {
                // 指定日付の履歴を取得
                const profileHistoryRef = (0, firestore_1.doc)(firebase_1.db, 'users', lineUserId, 'profileHistory', targetDate);
                const profileDoc = await (0, firestore_1.getDoc)(profileHistoryRef);
                if (profileDoc.exists()) {
                    return profileDoc.data();
                }
                // 指定日付にない場合、その日付以前の最新プロフィールを取得
                const allProfilesRef = (0, firestore_1.collection)(firebase_1.db, 'users', lineUserId, 'profileHistory');
                const querySnapshot = await (0, firestore_1.getDocs)(allProfilesRef);
                const profiles = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id, changeDate: doc.id }, doc.data())));
                // 指定日付以前の履歴のみをフィルタして最新を取得
                const validProfiles = profiles.filter(profile => profile.changeDate <= targetDate);
                if (validProfiles.length > 0) {
                    const latestValidProfile = validProfiles.sort((a, b) => b.changeDate.localeCompare(a.changeDate))[0];
                    return latestValidProfile;
                }
                return null;
            }
            // 全ての履歴を取得
            const profileHistoryRef = (0, firestore_1.collection)(firebase_1.db, 'users', lineUserId, 'profileHistory');
            const querySnapshot = await (0, firestore_1.getDocs)(profileHistoryRef);
            const profiles = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
            return profiles.sort((a, b) => b.changeDate.localeCompare(a.changeDate));
        }
        catch (error) {
            console.error('プロフィール履歴取得エラー:', error);
            throw error;
        }
    }
    // ローカルストレージからの移行（一度だけ実行）
    async migrateFromLocalStorage(lineUserId) {
        try {
            // 既存のFirestoreデータをチェック
            const existingUser = await this.getUser(lineUserId);
            if (existingUser) {
                return false;
            }
            // ローカルストレージからデータを取得（クライアントサイドのみ）
            if (typeof window === 'undefined')
                return false;
            const counselingAnswers = localStorage.getItem('counselingAnswers');
            const aiAnalysis = localStorage.getItem('aiAnalysis');
            if (counselingAnswers) {
                const answers = JSON.parse(counselingAnswers);
                const analysis = aiAnalysis ? JSON.parse(aiAnalysis) : null;
                // カウンセリング結果を保存
                await this.saveCounselingResult(lineUserId, answers, analysis);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('移行エラー:', error);
            return false;
        }
    }
}
exports.FirestoreService = FirestoreService;
exports.default = FirestoreService;
//# sourceMappingURL=firestoreService.js.map