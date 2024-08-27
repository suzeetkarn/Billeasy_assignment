"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
app_1.default.listen(env_1.default.PORT, () => {
    console.log(`Server is running on port ${env_1.default.PORT}`);
});
