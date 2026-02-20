"use strict";
// 決済関連のユーティリティ関数とタイプ定義
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANS = exports.STRIPE_CONFIG = void 0;
exports.createPaymentSession = createPaymentSession;
exports.createTrialPaymentSession = createTrialPaymentSession;
exports.getPaymentStatus = getPaymentStatus;
exports.changePlan = changePlan;
exports.cancelSubscription = cancelSubscription;
exports.getPaymentHistory = getPaymentHistory;
// Stripe関連の設定（後で実装）
exports.STRIPE_CONFIG = {
    publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
};
// プラン定義（月額プランのみ）
exports.PLANS = [
    {
        id: 'free',
        name: '無料プラン',
        price: 0,
        period: '無料',
        features: [
            'AI会話：1日5通まで',
            'LINE記録：1日2通まで',
            '基本的な記録機能'
        ],
        limitations: [
            'アプリからAI記録は使用不可',
            '1日のフィードバック機能なし',
            '詳細分析機能なし'
        ]
    },
    {
        id: 'monthly',
        name: '月額プラン',
        price: 790,
        period: '月額',
        stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1SyBTWKToWVElLyICovSkrUS',
        features: [
            'すべての機能が無制限',
            'AI会話・記録が使い放題',
            '1日のフィードバック機能',
            'アプリからAI記録機能'
        ]
    },
    {
        id: 'biannual',
        name: '半年プラン',
        price: 3000,
        period: '6ヶ月',
        originalPrice: 4740,
        discount: '37%OFF',
        stripePriceId: process.env.STRIPE_BIANNUAL_PRICE_ID || 'price_1SWx4vKToWVElLyI2TyVD57H',
        features: [
            'すべての機能が無制限',
            'AI会話・記録が使い放題',
            '1日のフィードバック機能',
            'アプリからAI記録機能',
            '月額より37%お得！'
        ]
    },
    {
        id: 'annual',
        name: '年間プラン',
        price: 4500,
        period: '12ヶ月',
        originalPrice: 9480,
        discount: '52%OFF',
        stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_1SyQczKToWVElLyIbT6ib3Q1',
        features: [
            'すべての機能が無制限',
            'AI会話・記録が使い放題',
            '1日のフィードバック機能',
            'アプリからAI記録機能',
            '月額より52%お得！'
        ]
    }
];
// 決済セッション作成（Stripe Checkout用）
async function createPaymentSession(planId, userId, successUrl, cancelUrl, includeTrial = false) {
    const plan = exports.PLANS.find(p => p.id === planId);
    if (!plan || plan.price === 0) {
        throw new Error('Invalid plan or free plan');
    }
    const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            planId,
            userId,
            priceId: plan.stripePriceId,
            includeTrial
        }),
    });
    const result = await response.json();
    if (!response.ok) {
        // 開発環境での特別処理
        if (result.dev_mode) {
            throw new Error(result.error || '開発環境では決済機能を使用できません');
        }
        throw new Error(result.error || 'Failed to create payment session');
    }
    return result;
}
// トライアル付き決済セッション作成（LP新規登録用）
async function createTrialPaymentSession(planId, userId, successUrl, cancelUrl) {
    return createPaymentSession(planId, userId, successUrl, cancelUrl, true);
}
// 決済状況確認
async function getPaymentStatus(sessionId) {
    const response = await fetch(`/api/payment/status/${sessionId}`);
    if (!response.ok) {
        throw new Error('Failed to get payment status');
    }
    return response.json();
}
// プラン変更（サブスクリプション管理）
async function changePlan(userId, newPlanId) {
    const response = await fetch('/api/payment/change-plan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            newPlanId
        }),
    });
    if (!response.ok) {
        throw new Error('Failed to change plan');
    }
    return response.json();
}
// サブスクリプション解約
async function cancelSubscription(userId) {
    const response = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
        throw new Error('Failed to cancel subscription');
    }
    return response.json();
}
// 決済履歴取得
async function getPaymentHistory(userId) {
    const response = await fetch(`/api/payment/history/${userId}`);
    if (!response.ok) {
        throw new Error('Failed to get payment history');
    }
    return response.json();
}
//# sourceMappingURL=payment.js.map