"use strict";
/**
 * カウンセリング完了状態をチェックし、未完了の場合はカウンセリングページに誘導する
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCounselingCompleted = isCounselingCompleted;
exports.handleCounselingRequired = handleCounselingRequired;
exports.withCounselingGuard = withCounselingGuard;
/**
 * カウンセリングが完了しているかどうかをチェック
 */
function isCounselingCompleted(counselingResult) {
    var _a, _b;
    if (!counselingResult)
        return false;
    // aiAnalysisと栄養プランが存在し、カロリー目標が設定されているかチェック
    return !!(((_b = (_a = counselingResult.aiAnalysis) === null || _a === void 0 ? void 0 : _a.nutritionPlan) === null || _b === void 0 ? void 0 : _b.dailyCalories) &&
        counselingResult.answers);
}
/**
 * カウンセリング未完了時の誘導メッセージを表示し、カウンセリングページに遷移
 */
function handleCounselingRequired(onNavigateToCounseling, actionName = 'この機能') {
    const shouldProceed = confirm(`${actionName}を利用するには、まず初期設定（カウンセリング）を完了する必要があります。\n\n今すぐ設定を開始しますか？`);
    if (shouldProceed) {
        onNavigateToCounseling();
    }
    return false; // 元の処理は実行しない
}
/**
 * カウンセリング状態をチェックして、必要に応じて誘導する高階関数
 */
function withCounselingGuard(counselingResult, onNavigateToCounseling, actionName, originalHandler) {
    return (...args) => {
        if (!isCounselingCompleted(counselingResult)) {
            handleCounselingRequired(onNavigateToCounseling, actionName);
            return;
        }
        // カウンセリング完了済みなら元の処理を実行
        originalHandler(...args);
    };
}
//# sourceMappingURL=counselingGuard.js.map