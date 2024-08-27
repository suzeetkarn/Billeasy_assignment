"use strict";
// // src/routes/userRoutes.ts
// import { Router } from 'express';
// import { registerUser, loginUser } from '../controllers/userController';
Object.defineProperty(exports, "__esModule", { value: true });
// const router = Router();
// router.post('/users', registerUser);
// router.post('/auth/login', loginUser);
// export default router;
// src/routes/userRoutes.ts
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.post('/register', userController_1.registerUser);
exports.default = router;
