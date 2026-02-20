"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBMI = calculateBMI;
exports.getBMICategory = getBMICategory;
exports.calculateBMR = calculateBMR;
exports.calculateTDEE = calculateTDEE;
exports.calculateCalorieTarget = calculateCalorieTarget;
exports.calculateMacroTargets = calculateMacroTargets;
exports.calculateIdealWeight = calculateIdealWeight;
exports.calculateWeightLossTimeframe = calculateWeightLossTimeframe;
exports.calculateWaterIntake = calculateWaterIntake;
exports.calculateSleepTarget = calculateSleepTarget;
exports.formatCalories = formatCalories;
exports.formatWeight = formatWeight;
exports.formatBMI = formatBMI;
exports.formatMacro = formatMacro;
// Constants defined locally
const BMI_RANGES = {
    UNDERWEIGHT: { min: 0, max: 18.5 },
    NORMAL: { min: 18.5, max: 25 },
    OVERWEIGHT: { min: 25, max: 30 },
    OBESE: { min: 30, max: 100 }
};
const NUTRITION_TARGETS = {
    PROTEIN_RATIO: 0.15,
    CARB_RATIO: 0.55,
    FAT_RATIO: 0.30,
    FIBER_PER_1000CAL: 14
};
function calculateBMI(weight, height) {
    const heightM = height / 100;
    return weight / (heightM * heightM);
}
function getBMICategory(bmi) {
    if (bmi < BMI_RANGES.UNDERWEIGHT.max)
        return BMI_RANGES.UNDERWEIGHT;
    if (bmi < BMI_RANGES.NORMAL.max)
        return BMI_RANGES.NORMAL;
    if (bmi < BMI_RANGES.OVERWEIGHT.max)
        return BMI_RANGES.OVERWEIGHT;
    return BMI_RANGES.OBESE;
}
function calculateBMR(profile) {
    const { weight, height, age, gender } = profile;
    if (gender === 'male') {
        return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
    }
    else {
        return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
    }
}
function calculateTDEE(profileOrBmr, activityLevel) {
    if (typeof profileOrBmr === 'number') {
        // BMRと活動レベルが個別に渡された場合
        const activityMultiplier = getActivityMultiplier(activityLevel);
        return Math.round(profileOrBmr * activityMultiplier);
    }
    else {
        // プロフィール全体が渡された場合
        const bmr = calculateBMR(profileOrBmr);
        const activityMultiplier = getActivityMultiplier(profileOrBmr.activityLevel);
        return Math.round(bmr * activityMultiplier);
    }
}
function getActivityMultiplier(activityLevel) {
    const multipliers = {
        sedentary: 1.2, // ほとんど運動しない
        light: 1.375, // 軽い運動をする
        moderate: 1.55, // 定期的に運動する
        active: 1.725, // 活発な運動
        very_active: 1.9, // 非常に活発
        // 旧値のサポート（下位互換性）
        low: 1.2,
        slightly_low: 1.375,
        normal: 1.55,
        high: 1.725,
        very_high: 1.9,
    };
    return multipliers[activityLevel] || 1.55;
}
function calculateCalorieTarget(profile, goals) {
    const tdee = calculateTDEE(profile);
    const primaryGoal = goals[0];
    if (!primaryGoal)
        return Math.round(tdee);
    switch (primaryGoal.type) {
        case 'rapid_loss':
            return Math.round(tdee - 700); // -0.7kg/週
        case 'moderate_loss':
            return Math.round(tdee - 500); // -0.5kg/週
        case 'slow_loss':
            return Math.round(tdee - 250); // -0.25kg/週
        case 'maintenance':
            return Math.round(tdee); // 現状維持
        case 'lean_gain':
            return Math.round(tdee + 200); // +0.2kg/週
        case 'moderate_gain':
            return Math.round(tdee + 300); // +0.3kg/週
        case 'bulk_gain':
            return Math.round(tdee + 500); // +0.5kg/週
        // 旧形式のサポート（下位互換性）
        case 'weight_loss':
            return Math.round(tdee - 500);
        case 'weight_gain':
            return Math.round(tdee + 500);
        case 'muscle_gain':
            return Math.round(tdee + 300);
        default:
            return Math.round(tdee);
    }
}
function calculateMacroTargets(calorieTarget) {
    return {
        protein: Math.round((calorieTarget * NUTRITION_TARGETS.PROTEIN_RATIO) / 4),
        carbs: Math.round((calorieTarget * NUTRITION_TARGETS.CARB_RATIO) / 4),
        fat: Math.round((calorieTarget * NUTRITION_TARGETS.FAT_RATIO) / 9),
        fiber: Math.round((calorieTarget / 1000) * NUTRITION_TARGETS.FIBER_PER_1000CAL),
    };
}
function calculateIdealWeight(height, _gender) {
    const heightM = height / 100;
    const idealBMI = 22; // WHO推奨の理想BMI
    return idealBMI * (heightM * heightM);
}
function calculateWeightLossTimeframe(currentWeight, targetWeight, weeklyLossKg = 0.5) {
    const weightToLose = currentWeight - targetWeight;
    if (weightToLose <= 0)
        return 0;
    return Math.ceil(weightToLose / weeklyLossKg);
}
function calculateWaterIntake(weight, activityLevel) {
    const baseIntake = weight * 35; // 基本: 35ml/kg
    const activityMultipliers = {
        low: 1,
        slightly_low: 1.1,
        normal: 1.2,
        high: 1.3,
        very_high: 1.4,
    };
    return Math.round(baseIntake * (activityMultipliers[activityLevel] || 1.2));
}
function calculateSleepTarget(age) {
    if (age < 18)
        return 9;
    if (age < 26)
        return 8.5;
    if (age < 65)
        return 8;
    return 7.5;
}
function formatCalories(calories) {
    return new Intl.NumberFormat('ja-JP').format(Math.round(calories));
}
function formatWeight(weight) {
    return `${weight.toFixed(1)}kg`;
}
function formatBMI(bmi) {
    return bmi.toFixed(1);
}
function formatMacro(amount, unit = 'g') {
    return `${Math.round(amount)}${unit}`;
}
//# sourceMappingURL=calculations.js.map