import { Request, Response } from 'express'
import {
  createTicket,
  findTicketById,
  assignUserToTicket,
  ticketAnalytics,
  dashboardAnalytics,
} from '../models/ticketModel'
import { findUserById } from '../models/userModel'
import pool from '../config/database'

export const generateTicket = async (req: Request | any, res: Response) => {
  const {
    title,
    description,
    type,
    venue,
    status,
    price,
    priority,
    dueDate,
    createdBy,
  } = req.body

  if (!req.user || req.user.id !== createdBy) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const user = await findUserById(createdBy)
  if (!user) {
    return res.status(400).json({ message: 'Invalid user' })
  }

  if (new Date(dueDate) < new Date()) {
    return res.status(400).json({ message: 'Due date must be in the future' })
  }

  const ticket = await createTicket(
    title,
    description,
    type,
    venue,
    status,
    price,
    priority,
    dueDate,
    createdBy
  )

  return res.status(201).json({
    ...ticket,
    assignedUsers: [],
  })
}

export const getTicketDetails = async (req: Request, res: Response) => {
  const { ticketId } = req.params

  try {
    const ticket = await findTicketById(ticketId)

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    const response = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
      venue: ticket.venue,
      status: ticket.status,
      price: ticket.price,
      priority: ticket.priority,
      dueDate: ticket.dueDate,
      createdBy: ticket.createdBy,
      assignedUsers: ticket.assigned_users,
      statistics: ticket.statistics,
    }

    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

export const assignTicketToUser = async (req: Request, res: Response) => {
  const { ticketId } = req.params
  const { userId } = req.body

  try {
    const ticketResult = await pool.query(
      'SELECT status, created_by FROM tickets WHERE id = $1',
      [ticketId]
    )
    const ticket = ticketResult.rows[0]

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    if (ticket.status === 'closed') {
      return res
        .status(400)
        .json({ message: 'Cannot assign users to a closed ticket' })
    }

    const userResult = await pool.query(
      'SELECT id, type FROM users WHERE id = $1',
      [userId]
    )
    const user = userResult.rows[0]

    if (!user) {
      return res.status(404).json({ message: 'User does not exist' })
    }

    if (user.type === 'admin') {
      return res
        .status(400)
        .json({ message: 'Cannot assign a ticket to an admin' })
    }

    const assignmentResult: any = await pool.query(
      'SELECT * FROM ticket_assignments WHERE ticket_id = $1 AND user_id = $2',
      [ticketId, userId]
    )

    if (assignmentResult.rowCount > 0) {
      return res.status(400).json({ message: 'User already assigned' })
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ticket_assignments WHERE user_id = $1',
      [userId]
    )
    const userCount = parseInt(countResult.rows[0].count, 10)

    const maxAssignments = 5
    if (userCount >= maxAssignments) {
      return res.status(400).json({ message: 'User assignment limit reached' })
    }

    await assignUserToTicket(ticketId, userId)

    return res.status(200).json({ message: 'User assigned successfully' })
  } catch (error) {
    console.error('Error assigning user to ticket:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const getTicketAnalytics = async (req: Request, res: Response) => {
  const filters = req.query

  try {
    const analytics = await ticketAnalytics(filters)
    return res.status(200).json(analytics)
  } catch (error) {
    console.error('Error getting ticket analytics:', error)
    return res.status(500).json({ message: 'Server error', error })
  }
}

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  const filters = req.query
  try {
    const analytics = await dashboardAnalytics(filters)
    return res.status(200).json(analytics)
  } catch (error) {
    console.error('Error getting ticket analytics:', error)
    return res.status(500).json({ message: 'Server error', error })
  }
}
