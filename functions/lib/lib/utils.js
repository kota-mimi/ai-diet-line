"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.generateId = generateId;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
const uuid_1 = require("uuid");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
/**
 * Generates a unique UUID v4 string for use as IDs in the application
 * This replaces Date.now().toString() for production-ready unique identifiers
 */
function generateId() {
    return (0, uuid_1.v4)();
}
//# sourceMappingURL=utils.js.map