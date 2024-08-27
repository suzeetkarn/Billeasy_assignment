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
exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const userModel_1 = require("../models/userModel");
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, type, password } = req.body;
    // Validate inputs
    if (!name || !email || !type || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    // Check if user already exists
    const existingUser = yield (0, userModel_1.findUserByEmail)(email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
    }
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    // Create user
    const user = yield (0, userModel_1.createUser)(name, email, type, hashedPassword);
    return res.status(201).json(user);
});
exports.registerUser = registerUser;
