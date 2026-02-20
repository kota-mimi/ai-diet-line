"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USAGE_LIMITS = void 0;
exports.getUserPlan = getUserPlan;
exports.getTodayUsage = getTodayUsage;
exports.recordUsage = recordUsage;
exports.checkUsageLimit = checkUsageLimit;
// 利用制限チェック機能
const firebase_admin_1 = require("../lib/firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
// プラン別の制限設定
exports.USAGE_LIMITS = {
    free: {
        aiMessagesPerDay: 3, // AI会話：1日3通まで
        recordsPerDay: 1, // LINE記録：1日1通まで
        webAppAiAccess: false // アプリからAI記録は使用不可
    },
    monthly: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    quarterly: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    biannual: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    annual: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    crowdfund_1m: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    crowdfund_3m: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    crowdfund_6m: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    crowdfund_lifetime: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    },
    lifetime: {
        aiMessagesPerDay: -1, // 無制限
        recordsPerDay: -1, // 無制限
        webAppAiAccess: true // WebアプリAI機能あり
    }
};
// 開発者用特別ID（永続無料アクセス）- 削除済み
// const DEVELOPER_IDS = [];
// ユーザーの現在のプランを取得
async function getUserPlan(userId) {
    var _a, _b;
    try {
        // 開発者IDの特別扱い削除済み
        const db = firebase_admin_1.admin.firestore();
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return 'free'; // デフォルトは無料プラン
        }
        const userData = userDoc.data();
        const subscriptionStatus = (userData === null || userData === void 0 ? void 0 : userData.subscriptionStatus) || 'inactive';
        const currentPlan = userData === null || userData === void 0 ? void 0 : userData.currentPlan;
        // 解約予定だが有料期間中の場合
        if (subscriptionStatus === 'cancel_at_period_end') {
            const periodEnd = (_a = userData === null || userData === void 0 ? void 0 : userData.currentPeriodEnd) === null || _a === void 0 ? void 0 : _a.toDate();
            if (periodEnd && new Date() < periodEnd) {
                console.log('🎁 解約予定だが有料期間中: 無制限アクセス許可', { userId, periodEnd });
                if (currentPlan === '月額プラン')
                    return 'monthly';
                if (currentPlan === '3ヶ月プラン')
                    return 'quarterly';
                if (currentPlan === '半年プラン')
                    return 'biannual';
                if (currentPlan === '年間プラン')
                    return 'annual';
                return 'monthly'; // デフォルト
            }
        }
        // 永続プランの場合
        if (subscriptionStatus === 'lifetime') {
            return 'lifetime';
        }
        // アクティブなサブスクリプションがある場合
        if (subscriptionStatus === 'active' || subscriptionStatus === 'cancel_at_period_end') {
            if (currentPlan === '月額プラン')
                return 'monthly';
            if (currentPlan === '3ヶ月プラン')
                return 'quarterly';
            if (currentPlan === '半年プラン')
                return 'biannual';
            if (currentPlan === '年間プラン')
                return 'annual';
            // クーポン適用プランの場合
            if ((_b = userData === null || userData === void 0 ? void 0 : userData.couponUsed) === null || _b === void 0 ? void 0 : _b.startsWith('CF')) {
                if (currentPlan === null || currentPlan === void 0 ? void 0 : currentPlan.includes('1ヶ月プラン'))
                    return 'crowdfund_1m';
                if (currentPlan === null || currentPlan === void 0 ? void 0 : currentPlan.includes('3ヶ月プラン'))
                    return 'crowdfund_3m';
                if (currentPlan === null || currentPlan === void 0 ? void 0 : currentPlan.includes('6ヶ月プラン'))
                    return 'crowdfund_6m';
                if (currentPlan === null || currentPlan === void 0 ? void 0 : currentPlan.includes('永久利用プラン'))
                    return 'crowdfund_lifetime';
            }
        }
        return 'free';
    }
    catch (error) {
        console.error('❌ プラン取得エラー:', error);
        return 'free'; // エラー時は無料プランにフォールバック
    }
}
// 今日の使用回数を取得
async function getTodayUsage(userId, type) {
    try {
        const db = firebase_admin_1.admin.firestore();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
        const usageRef = db.collection('usage_tracking')
            .doc(userId)
            .collection('daily')
            .doc(today);
        const usageDoc = await usageRef.get();
        if (!usageDoc.exists) {
            return 0;
        }
        const usageData = usageDoc.data();
        return (usageData === null || usageData === void 0 ? void 0 : usageData[type]) || 0;
    }
    catch (error) {
        console.error('❌ 使用回数取得エラー:', error);
        return 0;
    }
}
// 使用回数を記録
async function recordUsage(userId, type) {
    try {
        const db = firebase_admin_1.admin.firestore();
        const today = new Date().toISOString().split('T')[0];
        const usageRef = db.collection('usage_tracking')
            .doc(userId)
            .collection('daily')
            .doc(today);
        await usageRef.set({
            [type]: firestore_1.FieldValue.increment(1),
            lastUpdated: firestore_1.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`📊 使用回数記録: ${userId} - ${type} +1 (${today})`);
    }
    catch (error) {
        console.error('❌ 使用回数記録エラー:', error);
    }
}
// 利用制限チェック
async function checkUsageLimit(userId, type) {
    try {
        // 1. ユーザーのプランを取得
        const userPlan = await getUserPlan(userId);
        const limits = exports.USAGE_LIMITS[userPlan] || exports.USAGE_LIMITS.free;
        console.log(`🔍 利用制限チェック: ${userId} - ${type}, プラン: ${userPlan}`);
        // 2. 制限値を確認
        const dailyLimit = type === 'ai' ? limits.aiMessagesPerDay : limits.recordsPerDay;
        // 無制限の場合
        if (dailyLimit === -1) {
            console.log(`✅ 無制限プラン: ${userPlan}`);
            return { allowed: true };
        }
        // 3. 今日の使用回数を取得
        const todayUsage = await getTodayUsage(userId, type);
        console.log(`📊 使用状況: ${todayUsage}/${dailyLimit}`);
        // 4. 制限チェック
        if (todayUsage >= dailyLimit) {
            const actionName = type === 'ai' ? 'AI会話' : '記録';
            console.log(`⚠️ 制限達成: ${actionName} ${todayUsage}/${dailyLimit}`);
            return {
                allowed: false,
                reason: `${actionName}の1日の制限（${dailyLimit}回）に達しました。\n有料プランにアップグレードすると無制限でご利用いただけます。`,
                usage: todayUsage,
                limit: dailyLimit
            };
        }
        const actionName = type === 'ai' ? 'AI会話' : '記録';
        console.log(`✅ 制限内: ${actionName} ${todayUsage}/${dailyLimit}`);
        return {
            allowed: true,
            usage: todayUsage,
            limit: dailyLimit
        };
    }
    catch (error) {
        console.error('❌ 利用制限チェックエラー:', error);
        // エラー時は制限なしで通す（サービス継続性を重視）
        return { allowed: true };
    }
}
//# sourceMappingURL=usageLimits.js.map