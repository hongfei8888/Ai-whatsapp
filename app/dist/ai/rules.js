"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchKeywordRule = matchKeywordRule;
const keywordRules = [
    {
        keywords: ['\u9000\u6b3e', '\u9000\u8d27', '\u9000\u8d39'],
        reply: '\u5df2\u6536\u5230\u60a8\u7684\u9000\u6b3e\u7533\u8bf7\uff0c\u6211\u4eec\u4f1a\u572824\u5c0f\u65f6\u5185\u4e3a\u60a8\u5904\u7406\uff0c\u8bf7\u4fdd\u6301\u7535\u8bdd\u7545\u901a\u3002',
    },
    {
        keywords: ['\u6295\u8bc9', '\u4e0d\u6ee1', '\u95ee\u9898'],
        reply: '\u975e\u5e38\u62b1\u6b49\u7ed9\u60a8\u5e26\u6765\u4e0d\u4fbf\uff0c\u6211\u4f1a\u7acb\u5373\u5c06\u60a8\u7684\u53cd\u9988\u63d0\u4ea4\u7ed9\u4eba\u5de5\u5ba2\u670d\u8ddf\u8fdb\u3002',
    },
    {
        keywords: ['\u4ef7\u683c', '\u62a5\u4ef7', '\u8d39\u7528'],
        reply: '\u5173\u4e8e\u4ef7\u683c\u95ee\u9898\uff0c\u6211\u4eec\u4f1a\u5c3d\u5feb\u4e3a\u60a8\u63d0\u4f9b\u8be6\u7ec6\u65b9\u6848\uff0c\u8bf7\u60a8\u7a0d\u540e\u7559\u610f\u6d88\u606f\u3002',
    },
    {
        keywords: ['\u4f60\u597d', '\u60a8\u597d', 'hello', 'hi'],
        reply: '\u60a8\u597d\uff0c\u8fd9\u91cc\u662f\u60a8\u7684\u667a\u80fd\u52a9\u624b\uff0c\u8bf7\u544a\u8bc9\u6211\u60a8\u9700\u8981\u7684\u5e2e\u52a9\u3002',
    },
];
function matchKeywordRule(message) {
    const normalized = message.toLowerCase();
    for (const rule of keywordRules) {
        const matched = rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
        if (matched) {
            return rule.reply;
        }
    }
    return null;
}
//# sourceMappingURL=rules.js.map