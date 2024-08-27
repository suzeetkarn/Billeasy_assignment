"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = exports.findUserByEmail = exports.createUser = void 0;
// src/models/userModel.ts
const database_1 = __importDefault(require("../config/database"));
const createUser = (name, email, type, hashedPassword) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("herer=======");
    const result = yield database_1.default.query('INSERT INTO users (name, email, type, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email', [name, email, type, hashedPassword]);
    return result.rows[0];
});
exports.createUser = createUser;
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
});
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("finding======");
    const result = yield database_1.default.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return result.rows[0];
});
exports.findUserById = findUserById;
