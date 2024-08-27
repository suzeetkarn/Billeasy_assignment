import { Router } from 'express'
import {
  generateTicket,
  assignTicketToUser,
  getTicketAnalytics,
  getTicketDetails,
  getDashboardAnalytics,
} from '../controllers/ticketController'
import { authMiddleware } from '../middlewares/authMiddleware'

const router = Router()

router.post('/', authMiddleware, generateTicket)
router.get('/analytics', authMiddleware, getTicketAnalytics)
router.get('/dashboard/analytics', authMiddleware, getDashboardAnalytics)
router.get('/:ticketId', authMiddleware, getTicketDetails)
router.post('/:ticketId/assign', authMiddleware, assignTicketToUser)

export default router
