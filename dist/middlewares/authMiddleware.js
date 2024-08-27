"use strict";
// // src/middlewares/authMiddleware.ts
// import { Request, Response, NextFunction } from 'express';
// import { verifyToken } from '../config/jwt';
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../config/jwt");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided or Invalid format' });
    }
    const token = authHeader.split(' ')[1];
    console.log("token", token);
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        console.log("heyaaaaaa");
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
