"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureNoForbiddenKeyword = ensureNoForbiddenKeyword;
exports.containsForbiddenKeyword = containsForbiddenKeyword;
const config_1 = require("../config");
const errors_1 = require("../errors");
function ensureNoForbiddenKeyword(content) {
    const normalized = content.toLowerCase();
    const match = config_1.appConfig.bannedKeywords.find((keyword) => keyword.length > 0 && normalized.includes(keyword));
    if (match) {
        throw new errors_1.ForbiddenKeywordError(`Message contains forbidden keyword: ${match}`);
    }
}
function containsForbiddenKeyword(content) {
    const normalized = content.toLowerCase();
    const match = config_1.appConfig.bannedKeywords.find((keyword) => keyword.length > 0 && normalized.includes(keyword));
    return match ?? null;
}
//# sourceMappingURL=keyword-guard.js.map