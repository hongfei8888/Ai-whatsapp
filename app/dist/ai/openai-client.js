"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = getOpenAIClient;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
let cachedClient = null;
function getOpenAIClient() {
    if (!config_1.appConfig.openAiApiKey) {
        return null;
    }
    if (!cachedClient) {
        cachedClient = new openai_1.default({ apiKey: config_1.appConfig.openAiApiKey });
    }
    return cachedClient;
}
//# sourceMappingURL=openai-client.js.map