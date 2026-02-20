"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.lineWebhook = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const dotenv = __importStar(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const stripe_1 = __importDefault(require("stripe"));
// 環境変数を読み込み
dotenv.config();
// Firebase Admin初期化
if (!admin.apps.length) {
    admin.initializeApp();
}
// Stripe初期化
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
});
// **LINE Webhook Function**
exports.lineWebhook = functions.https.onRequest({
    region: 'asia-northeast1',
    memory: '1GiB',
    timeoutSeconds: 540,
}, async (req, res) => {
    var _a, _b;
    try {
        console.log('🔥 LINE Webhook呼び出し開始');
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const body = JSON.stringify(req.body);
        const signature = req.headers['x-line-signature'] || '';
        // LINE署名を検証
        if (!verifySignature(body, signature)) {
            console.error('🔥 署名検証失敗');
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        const data = req.body;
        let events = data.events || [];
        // メンテナンスモードチェック（開発者ID除外）
        if (process.env.MAINTENANCE_MODE === 'true') {
            // 開発者ID一覧
            const DEVELOPER_IDS = [
                process.env.DEVELOPER_LINE_ID,
                'U7fd12476d6263912e0d9c99fc3a6bef9', // 開発者ID復活
            ].filter(Boolean);
            // 開発者以外をブロック
            const nonDeveloperEvents = events.filter(event => {
                var _a;
                const userId = (_a = event.source) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId)
                    return true; // userIdがない場合はブロック
                if (DEVELOPER_IDS.includes(userId)) {
                    console.log('🔧 開発者ID検出: メンテナンス中でもアクセス許可', userId);
                    return false; // 開発者は通す
                }
                return true; // その他はブロック対象
            });
            if (nonDeveloperEvents.length > 0) {
                console.log('🔧 メンテナンスモード: 一般ユーザーリクエストをブロック');
                for (const event of nonDeveloperEvents) {
                    if (event.replyToken && (event.type === 'message' || event.type === 'postback')) {
                        const maintenanceMessage = {
                            type: 'text',
                            text: '🔧 メンテナンス中 🔧\\n\\n大変申し訳ございません。\\nただいまシステムメンテナンス中です。\\n\\nしばらくお待ちください。🙏'
                        };
                        try {
                            await replyMessage(event.replyToken, [maintenanceMessage]);
                            console.log('✅ メンテナンスメッセージ送信完了');
                        }
                        catch (error) {
                            console.error('❌ メンテナンスメッセージ送信失敗:', error);
                        }
                    }
                }
            }
            // 開発者のイベントのみを処理対象として残す（メンテナンスモード時）
            const developerEvents = events.filter(event => {
                var _a;
                const userId = (_a = event.source) === null || _a === void 0 ? void 0 : _a.userId;
                return userId && DEVELOPER_IDS.includes(userId);
            });
            // 開発者イベントが無い場合はここで終了
            if (developerEvents.length === 0) {
                res.json({ status: 'maintenance_mode' });
                return;
            }
            // 処理対象を開発者イベントのみに変更
            events = developerEvents;
            console.log('🔧 開発者イベント継続処理:', events.length, '件');
        }
        // 各イベントを処理
        for (const event of events) {
            // 重複チェック（Firestoreベース）
            const eventKey = `${((_a = event.source) === null || _a === void 0 ? void 0 : _a.userId) || 'unknown'}_${((_b = event.message) === null || _b === void 0 ? void 0 : _b.id) || event.timestamp}`;
            const isProcessed = await checkAndMarkProcessed(eventKey);
            if (isProcessed) {
                continue; // 重複をスキップ
            }
            await handleEvent(event);
        }
        res.json({ status: 'OK' });
    }
    catch (error) {
        console.error('🔥 致命的なWebhookエラー:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// **Stripe Webhook Function**
exports.stripeWebhook = functions.https.onRequest({
    region: 'asia-northeast1',
    memory: '512MiB',
    timeoutSeconds: 60,
}, async (req, res) => {
    var _a, _b, _c;
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const body = JSON.stringify(req.body);
        const signature = req.headers['stripe-signature'];
        let event;
        // Webhook署名検証（セキュリティ強化）
        try {
            if (process.env.STRIPE_WEBHOOK_SECRET) {
                event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
                console.log('✅ Verified webhook from Stripe:', event.type);
            }
            else {
                // 開発環境など、署名検証なしで実行
                event = JSON.parse(body);
                console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
            }
        }
        catch (err) {
            console.error('❌ Webhook signature verification failed:', err);
            res.status(400).json({ error: 'Webhook signature verification failed' });
            return;
        }
        console.log('✅ Stripe webhook:', event.type);
        console.log('📊 Full event data:', JSON.stringify(event, null, 2));
        if (event.type === 'invoice.payment_succeeded') {
            console.log('💰 invoice.payment_succeeded イベント開始');
        }
        // トライアル開始 or 課金開始
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            // ユーザーIDを取得（複数の方法で試行）
            let userId = ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId) || session.client_reference_id;
            // CustomerからuserIdを取得（事前作成したCustomerの場合）
            if (!userId && session.customer) {
                try {
                    const customer = await stripe.customers.retrieve(session.customer);
                    console.log('🔍 Customer metadata:', customer.metadata);
                    if (customer && !customer.deleted && ((_b = customer.metadata) === null || _b === void 0 ? void 0 : _b.userId)) {
                        userId = customer.metadata.userId;
                        console.log(`💰 userId found in customer metadata: ${userId}`);
                    }
                    else {
                        console.log('❌ No userId in customer metadata');
                    }
                }
                catch (err) {
                    console.error('Failed to retrieve customer:', err);
                }
            }
            // DBから pending trials を検索（PaymentLinks用の代替手段）
            if (!userId) {
                try {
                    console.log('🔍 Searching for pending trials in DB...');
                    const pendingTrialsSnapshot = await admin.firestore()
                        .collection('pendingTrials')
                        .orderBy('createdAt', 'desc')
                        .limit(5)
                        .get();
                    if (!pendingTrialsSnapshot.empty) {
                        // 決済時刻と近いpendingTrialを探す（時刻マッチング）
                        const matchingTrial = pendingTrialsSnapshot.docs.find(doc => {
                            const data = doc.data();
                            const timeDiff = Math.abs(session.created * 1000 - data.createdAt.toMillis());
                            return timeDiff < 300000; // 5分以内
                        });
                        if (matchingTrial) {
                            const trialData = matchingTrial.data();
                            userId = trialData.userId;
                            // pending trial を completed に更新
                            await matchingTrial.ref.update({ status: 'completed' });
                            console.log(`💰 時刻マッチでuserID特定: ${userId} (時差: ${Math.abs(session.created * 1000 - trialData.createdAt.toMillis())}ms)`);
                        }
                        else {
                            // フォールバック: 最新を使用
                            const latestTrial = pendingTrialsSnapshot.docs[0];
                            const trialData = latestTrial.data();
                            userId = trialData.userId;
                            await latestTrial.ref.update({ status: 'completed' });
                            console.log(`💰 フォールバック: 最新のuserID使用: ${userId}`);
                        }
                    }
                }
                catch (err) {
                    console.error('Failed to retrieve pending trials:', err);
                }
            }
            if (!userId) {
                console.error('❌ No userId found in session, customer, metadata, or pending trials');
                console.error('Session customer:', session.customer);
                console.error('Session client_reference_id:', session.client_reference_id);
                console.error('Session metadata:', session.metadata);
                res.status(400).json({ error: 'No userId' });
                return;
            }
            console.log(`💰 checkout開始 - userId: ${userId}`);
            // サブスクリプション情報を取得
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            // metadataからplanIdを取得してプラン名を決定
            const planId = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.planId;
            let currentPlan = '月額プラン'; // デフォルト
            if (planId === 'annual') {
                currentPlan = '年間プラン';
            }
            else if (planId === 'biannual') {
                currentPlan = '半年プラン';
            }
            else if (planId === 'monthly') {
                currentPlan = '月額プラン';
            }
            console.log(`💰 checkout完了 - planId: ${planId}, プラン: ${currentPlan}`);
            await admin.firestore().collection('users').doc(userId).update({
                subscriptionStatus: 'active',
                currentPlan: currentPlan,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: session.customer,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                updatedAt: new Date(),
            });
            console.log('✅ User updated:', userId, 'active');
            // 有料プラン開始通知を送信
            if (userId) {
                try {
                    await pushMessage(userId, [{
                            type: 'text',
                            text: '🎉 有料プランが開始されました！\\n\\nAI機能を無制限でご利用いただけます。'
                        }]);
                    console.log('✅ 有料プラン開始通知送信完了:', userId);
                }
                catch (error) {
                    console.error('❌ 有料プラン開始通知送信失敗:', error);
                }
            }
        }
        // その他のStripeイベント処理...
        // （元のコードから必要な部分を移植）
        res.json({ received: true });
    }
    catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook failed' });
    }
});
// **Helper Functions**
function verifySignature(body, signature) {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret)
        return false;
    const hash = crypto_1.default
        .createHmac('sha256', channelSecret)
        .update(body, 'utf8')
        .digest('base64');
    return hash === signature;
}
// TODO: [複製時注意] デプロイ後に発行されたURLに変更する
async function handleEvent(event) {
    // 元のwebhook/route.tsからhandleEvent関数の内容をコピー
    const { type, replyToken, source, message } = event;
    switch (type) {
        case 'message':
            await handleMessage(replyToken, source, message);
            break;
        case 'follow':
            await handleFollow(replyToken, source);
            break;
        case 'postback':
            await handlePostback(replyToken, source, event.postback);
            break;
        default:
            console.log('Unknown event type:', type);
    }
}
async function handleMessage(replyToken, source, message) {
    // メイン処理をここに実装
    // 元のhandleMessage関数の内容を移植
    console.log('Message handling:', message.type);
    // TODO: [複製時注意] 完全な実装を移植する
    await replyMessage(replyToken, [{
            type: 'text',
            text: 'Firebase Functionsで動作中です！'
        }]);
}
async function handleFollow(replyToken, source) {
    // TODO: [複製時注意] デプロイ後に発行されたURLに変更する
    const welcomeMessage = {
        type: 'template',
        altText: 'LINE健康管理へようこそ！',
        template: {
            type: 'buttons',
            text: 'こんにちは！ヘルシーくんです！\\n\\n健康管理をお手伝いするために、あなたについていくつか教えてもらえる？',
            actions: [{
                    type: 'uri',
                    label: 'カウンセリング開始',
                    // TODO: [複製時注意] デプロイ後に発行されたURLに変更する
                    uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
                }]
        }
    };
    await replyMessage(replyToken, [welcomeMessage]);
}
async function handlePostback(replyToken, source, postback) {
    // TODO: 元のhandlePostback関数の完全な実装を移植
    console.log('Postback handling:', postback.data);
}
async function checkAndMarkProcessed(eventKey) {
    try {
        const db = admin.firestore();
        // イベントキーをハッシュ化（UserIDを含む場合があるため）
        const hashedEventKey = crypto_1.default.createHash('sha256').update(eventKey).digest('hex').substring(0, 20);
        const docRef = db.collection('processedEvents').doc(hashedEventKey);
        const doc = await docRef.get();
        if (doc.exists) {
            console.log('🚫 重複イベント検出 (Firestore):', hashedEventKey);
            return true; // 既に処理済み
        }
        // 5分TTL + 自動削除設定
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分後
        await docRef.set({
            processedAt: new Date(),
            expiresAt: expiresAt,
            ttl: expiresAt
        });
        return false; // 新しいイベント
    }
    catch (error) {
        console.error('重複チェックエラー:', error);
        return false; // エラー時は処理を継続
    }
}
async function replyMessage(replyToken, messages) {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
        return;
    }
    try {
        const response = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                replyToken,
                messages,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to reply message:', error);
        }
    }
    catch (error) {
        console.error('Error replying message:', error);
    }
}
async function pushMessage(userId, messages) {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
        return;
    }
    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                to: userId,
                messages,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('Failed to push message:', error);
        }
    }
    catch (error) {
        console.error('Error pushing message:', error);
    }
}
//# sourceMappingURL=index.js.map