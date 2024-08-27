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
exports.getDashboardAnalytics = exports.getTicketAnalytics = exports.assignTicketToUser = exports.getTicketDetails = exports.generateTicket = void 0;
const ticketModel_1 = require("../models/ticketModel");
const userModel_1 = require("../models/userModel");
const database_1 = __importDefault(require("../config/database"));
const generateTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, type, venue, status, price, priority, dueDate, createdBy } = req.body;
    // Validate inputs and authentication
    if (!req.user || req.user.id !== createdBy) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Check if user exists
    const user = yield (0, userModel_1.findUserById)(createdBy);
    if (!user) {
        return res.status(400).json({ message: 'Invalid user' });
    }
    // Check due date
    if (new Date(dueDate) < new Date()) {
        return res.status(400).json({ message: 'Due date must be in the future' });
    }
    // Create ticket
    const ticket = yield (0, ticketModel_1.createTicket)(title, description, type, venue, status, price, priority, dueDate, createdBy);
    return res.status(201).json(Object.assign(Object.assign({}, ticket), { assignedUsers: [] }));
});
exports.generateTicket = generateTicket;
const getTicketDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticketId } = req.params;
    try {
        // Fetch the ticket details
        const ticket = yield (0, ticketModel_1.findTicketById)(ticketId);
        // Check if the ticket exists
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Format the response
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
            statistics: ticket.statistics
        };
        // Send the response
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getTicketDetails = getTicketDetails;
const assignTicketToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ticketId } = req.params;
    const { userId } = req.body;
    try {
        // Step 1: Check if the ticket is closed
        const ticketResult = yield database_1.default.query('SELECT status, created_by FROM tickets WHERE id = $1', [ticketId]);
        const ticket = ticketResult.rows[0];
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot assign users to a closed ticket' });
        }
        // Step 2: Check if the user exists and is not an admin
        const userResult = yield database_1.default.query('SELECT id, type FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) {
            return res.status(404).json({ message: 'User does not exist' });
        }
        if (user.type === 'admin') {
            return res.status(400).json({ message: 'Cannot assign a ticket to an admin' });
        }
        // Step 3: Check if the user is already assigned to the ticket
        const assignmentResult = yield database_1.default.query('SELECT * FROM ticket_assignments WHERE ticket_id = $1 AND user_id = $2', [ticketId, userId]);
        if (assignmentResult.rowCount > 0) {
            return res.status(400).json({ message: 'User already assigned' });
        }
        // Step 4: Check if the assignment limit is reached
        const countResult = yield database_1.default.query('SELECT COUNT(*) FROM ticket_assignments WHERE user_id = $1', [userId]);
        const userCount = parseInt(countResult.rows[0].count, 10);
        const maxAssignments = 5; // Define the max number of users per ticket
        if (userCount >= maxAssignments) {
            return res.status(400).json({ message: 'User assignment limit reached' });
        }
        // Step 5: Assign the user to the ticket
        yield (0, ticketModel_1.assignUserToTicket)(ticketId, userId);
        return res.status(200).json({ message: 'User assigned successfully' });
    }
    catch (error) {
        console.error('Error assigning user to ticket:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.assignTicketToUser = assignTicketToUser;
const getTicketAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = req.query;
    try {
        // Get analytics
        const analytics = yield (0, ticketModel_1.ticketAnalytics)(filters);
        // Send the response
        return res.status(200).json(analytics);
    }
    catch (error) {
        console.error('Error getting ticket analytics:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
});
exports.getTicketAnalytics = getTicketAnalytics;
const getDashboardAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = req.query;
    try {
        // Get analytics
        const analytics = yield (0, ticketModel_1.dashboardAnalytics)(filters);
        // Send the response
        return res.status(200).json(analytics);
    }
    catch (error) {
        console.error('Error getting ticket analytics:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
    // try {
    //   // Base query for ticket analytics
    //   let query = `
    //     SELECT
    //       COUNT(*) AS totalTickets,
    //       COUNT(*) FILTER (WHERE status = 'closed') AS closedTickets,
    //       COUNT(*) FILTER (WHERE status = 'open') AS openTickets,
    //       COUNT(*) FILTER (WHERE status = 'in-progress') AS inProgressTickets,
    //       AVG(price) AS averageCustomerSpending,
    //       COUNT(*) / NULLIF(DATE_PART('day', NOW() - MIN(created_at)), 0) AS averageTicketsBookedPerDay
    //     FROM tickets
    //     WHERE 1 = 1
    //   `;
    //   const params: any[] = [];
    //   // Apply filters if present
    //   if (startDate) {
    //     params.push(startDate);
    //     query += ` AND created_at >= $${params.length}`;
    //   }
    //   if (endDate) {
    //     params.push(endDate);
    //     query += ` AND created_at <= $${params.length}`;
    //   }
    //   if (status) {
    //     params.push(status);
    //     query += ` AND status = $${params.length}`;
    //   }
    //   if (priority) {
    //     params.push(priority);
    //     query += ` AND priority = $${params.length}`;
    //   }
    //   if (type) {
    //     params.push(type);
    //     query += ` AND type = $${params.length}`;
    //   }
    //   if (venue) {
    //     params.push(venue);
    //     query += ` AND venue = $${params.length}`;
    //   }
    //   // Execute the base query for ticket counts and averages
    //   const result = await pool.query(query, params);
    //   const analytics = result.rows[0];
    //   // Query for priority distribution
    //   const priorityQuery = `
    //     SELECT
    //       priority,
    //       COUNT(*) AS count,
    //       COUNT(*) / NULLIF(DATE_PART('day', NOW() - MIN(created_at)), 0) AS averageTicketsBookedPerDay
    //     FROM tickets
    //     WHERE 1 = 1
    //     ${startDate ? `AND created_at >= $1` : ''}
    //     ${endDate ? `AND created_at <= $2` : ''}
    //     GROUP BY priority
    //   `;
    //   const priorityParams = startDate && endDate ? [startDate, endDate] : [];
    //   const priorityResult = await pool.query(priorityQuery, priorityParams);
    //   const priorityDistribution:any = {};
    //   for (const row of priorityResult.rows) {
    //     priorityDistribution[row.priority] = row.count;
    //     priorityDistribution[`average${row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}TicketsBookedPerDay`] = parseFloat(row.averageTicketsBookedPerDay).toFixed(2);
    //   }
    //   // Query for type distribution
    //   const typeQuery = `
    //     SELECT
    //       type,
    //       COUNT(*) AS count
    //     FROM tickets
    //     WHERE 1 = 1
    //     ${startDate ? `AND created_at >= $1` : ''}
    //     ${endDate ? `AND created_at <= $2` : ''}
    //     GROUP BY type
    //   `;
    //   const typeResult = await pool.query(typeQuery, priorityParams);
    //   const typeDistribution:any = {};
    //   for (const row of typeResult.rows) {
    //     typeDistribution[row.type] = row.count;
    //   }
    //   // Construct the response
    //   const response = {
    //     totalTickets: parseInt(analytics.totaltickets, 10),
    //     closedTickets: parseInt(analytics.closedtickets, 10),
    //     openTickets: parseInt(analytics.opentickets, 10),
    //     averageCustomerSpending: parseFloat(analytics.averagecustomerspending).toFixed(2),
    //     averageTicketsBookedPerDay: parseFloat(analytics.averageticketsbookedperday).toFixed(2),
    //     inProgressTickets: parseInt(analytics.inprogresstickets, 10),
    //     priorityDistribution,
    //     typeDistribution,
    //   };
    //   res.status(200).json(response);
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ message: 'Error fetching ticket analytics' });
    // }
});
exports.getDashboardAnalytics = getDashboardAnalytics;
