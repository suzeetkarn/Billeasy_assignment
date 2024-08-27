"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ticketRoutes.ts
const express_1 = require("express");
const ticketController_1 = require("../controllers/ticketController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authMiddleware, ticketController_1.generateTicket);
router.get('/analytics', authMiddleware_1.authMiddleware, ticketController_1.getTicketAnalytics);
router.get('/dashboard/analytics', authMiddleware_1.authMiddleware, ticketController_1.getDashboardAnalytics);
router.post('/:ticketId/assign', authMiddleware_1.authMiddleware, ticketController_1.assignTicketToUser);
router.get('/:ticketId', authMiddleware_1.authMiddleware, ticketController_1.getTicketDetails);
exports.default = router;
