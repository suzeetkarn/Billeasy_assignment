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
exports.dashboardAnalytics = exports.ticketAnalytics = exports.assignUserToTicket = exports.findTicketById = exports.createTicket = void 0;
// src/models/ticketModel.ts
const database_1 = __importDefault(require("../config/database"));
const createTicket = (title, description, type, venue, status, price, priority, dueDate, createdBy // Updated to number
) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield database_1.default.query(`INSERT INTO tickets 
      (title, description, type, venue, status, price, priority, due_date, created_by) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING id, title, description, type, venue, status, price, priority, due_date, created_by`, [title, description, type, venue, status, price, priority, dueDate, createdBy]);
    return result.rows[0];
});
exports.createTicket = createTicket;
const findTicketById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield database_1.default.query(`SELECT 
        tickets.id, 
        tickets.title, 
        tickets.description, 
        tickets.type, 
        tickets.venue, 
        tickets.status, 
        tickets.price, 
        tickets.priority, 
        tickets.due_date AS "dueDate", 
        tickets.created_by AS "createdBy",
        COALESCE(
          json_agg(
            json_build_object(
              'userId', users.id,
              'name', users.name,
              'email', users.email
            )
          ) FILTER (WHERE users.id IS NOT NULL), 
          '[]'::json
        ) AS assigned_users,
        COUNT(ticket_assignments.user_id) AS total_assigned
    FROM tickets 
    LEFT JOIN ticket_assignments ON tickets.id = ticket_assignments.ticket_id 
    LEFT JOIN users ON ticket_assignments.user_id = users.id 
    WHERE tickets.id = $1 
    GROUP BY tickets.id`, [id]);
    if (result.rows.length === 0) {
        return null;
    }
    const ticket = result.rows[0];
    // Add statistics
    return Object.assign(Object.assign({}, ticket), { statistics: {
            totalAssigned: parseInt(ticket.total_assigned, 10),
            status: ticket.status
        } });
});
exports.findTicketById = findTicketById;
const assignUserToTicket = (ticketId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield database_1.default.query('INSERT INTO ticket_assignments (ticket_id, user_id) VALUES ($1, $2) RETURNING *', [ticketId, userId]);
    return result.rows[0];
});
exports.assignUserToTicket = assignUserToTicket;
const ticketAnalytics = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    // Base query for counts
    const baseCountQuery = `
    SELECT 
      COUNT(*) as total_tickets, 
      COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets, 
      COUNT(*) FILTER (WHERE status = 'open') as open_tickets, 
      COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_tickets,
      COUNT(*) FILTER (WHERE priority = 'low') as low_priority_tickets,
      COUNT(*) FILTER (WHERE priority = 'medium') as medium_priority_tickets,
      COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets,
      COUNT(*) FILTER (WHERE type = 'concert') as concert_tickets,
      COUNT(*) FILTER (WHERE type = 'conference') as conference_tickets,
      COUNT(*) FILTER (WHERE type = 'sports') as sports_tickets
    FROM tickets 
    WHERE 1=1`;
    // Base query for ticket details
    const baseDetailsQuery = `
    SELECT id, title, status, priority, type, venue, created_at as createdDate, created_by as createdBy
    FROM tickets
    WHERE 1=1`;
    // Initialize queries and parameters
    let countQuery = baseCountQuery;
    let detailsQuery = baseDetailsQuery;
    const params = [];
    let index = 1;
    // Add filters to the queries
    if (filters.startDate) {
        countQuery += ` AND created_at >= $${index}`;
        detailsQuery += ` AND created_at >= $${index}`;
        params.push(filters.startDate);
        index++;
    }
    if (filters.endDate) {
        countQuery += ` AND created_at <= $${index}`;
        detailsQuery += ` AND created_at <= $${index}`;
        params.push(filters.endDate);
        index++;
    }
    if (filters.status) {
        countQuery += ` AND status = $${index}`;
        detailsQuery += ` AND status = $${index}`;
        params.push(filters.status);
        index++;
    }
    if (filters.priority) {
        countQuery += ` AND priority = $${index}`;
        detailsQuery += ` AND priority = $${index}`;
        params.push(filters.priority);
        index++;
    }
    if (filters.type) {
        countQuery += ` AND type = $${index}`;
        detailsQuery += ` AND type = $${index}`;
        params.push(filters.type);
        index++;
    }
    if (filters.venue) {
        countQuery += ` AND venue = $${index}`;
        detailsQuery += ` AND venue = $${index}`;
        params.push(filters.venue);
        index++;
    }
    // Log queries and parameters for debugging
    console.log('Executing count query:', countQuery);
    console.log('With parameters:', params);
    try {
        // Execute the count query
        const countResult = yield database_1.default.query(countQuery, params);
        const counts = countResult.rows[0];
        // Execute the details query
        const detailsResult = yield database_1.default.query(detailsQuery, params);
        const tickets = detailsResult.rows;
        // Format the response
        const response = {
            totalTickets: parseInt(counts.total_tickets, 10),
            closedTickets: parseInt(counts.closed_tickets, 10),
            openTickets: parseInt(counts.open_tickets, 10),
            inProgressTickets: parseInt(counts.in_progress_tickets, 10),
            priorityDistribution: {
                low: parseInt(counts.low_priority_tickets, 10),
                medium: parseInt(counts.medium_priority_tickets, 10),
                high: parseInt(counts.high_priority_tickets, 10)
            },
            typeDistribution: {
                concert: parseInt(counts.concert_tickets, 10),
                conference: parseInt(counts.conference_tickets, 10),
                sports: parseInt(counts.sports_tickets, 10)
            },
            tickets
        };
        return response;
    }
    catch (error) {
        console.error('Query execution error:', error);
        throw error; // Re-throw error for controller to handle
    }
});
exports.ticketAnalytics = ticketAnalytics;
// export const dashboardAnalytics = async (filters: any) => {
//   let query = `
//       SELECT
//         COUNT(*) AS totalTickets,
//         COUNT(*) FILTER (WHERE status = 'closed') AS closedTickets,
//         COUNT(*) FILTER (WHERE status = 'open') AS openTickets,
//         COUNT(*) FILTER (WHERE status = 'in-progress') AS inProgressTickets,
//         AVG(price) AS averageCustomerSpending,
//         COUNT(*) / NULLIF(DATE_PART('day', NOW() - MIN(created_at)), 0) AS averageTicketsBookedPerDay
//       FROM tickets
//       WHERE 1 = 1
//     `;
//     const params: any[] = [];
//     // Apply filters if present
//     if (filters.startDate) {
//       params.push(filters.startDate);
//       query += ` AND created_at >= $${params.length}`;
//     }
//     if (filters.endDate) {
//       params.push(filters.endDate);
//       query += ` AND created_at <= $${params.length}`;
//     }
//     if (filters.status) {
//       params.push(filters.status);
//       query += ` AND status = $${params.length}`;
//     }
//     if (filters.priority) {
//       params.push(filters.priority);
//       query += ` AND priority = $${params.length}`;
//     }
//     if (filters.type) {
//       params.push(filters.type);
//       query += ` AND type = $${params.length}`;
//     }
//     if (filters.venue) {
//       params.push(filters.venue);
//       query += ` AND venue = $${params.length}`;
//     }
//     // Execute the base query for ticket counts and averages
//     const result = await pool.query(query, params);
//     const analytics = result.rows[0];
//     // Query for priority distribution
//     const priorityQuery = `
//       SELECT
//         priority,
//         COUNT(*) AS count,
//         COUNT(*) / NULLIF(DATE_PART('day', NOW() - MIN(created_at)), 0) AS averageTicketsBookedPerDay
//       FROM tickets
//       WHERE 1 = 1
//       ${filters.startDate ? `AND created_at >= $1` : ''}
//       ${filters.endDate ? `AND created_at <= $2` : ''}
//       GROUP BY priority
//     `;
//     const priorityParams = filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : [];
//     const priorityResult = await pool.query(priorityQuery, priorityParams);
//     const priorityDistribution:any = {};
//     for (const row of priorityResult.rows) {
//       priorityDistribution[row.priority] = row.count;
//       priorityDistribution[`average${row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}TicketsBookedPerDay`] = parseFloat(row.averageTicketsBookedPerDay).toFixed(2);
//     }
//     // Query for type distribution
//     const typeQuery = `
//       SELECT
//         type,
//         COUNT(*) AS count
//       FROM tickets
//       WHERE 1 = 1
//       ${filters.startDate ? `AND created_at >= $1` : ''}
//       ${filters.endDate ? `AND created_at <= $2` : ''}
//       GROUP BY type
//     `;
//     const typeResult = await pool.query(typeQuery, priorityParams);
//     const typeDistribution:any = {};
//     for (const row of typeResult.rows) {
//       typeDistribution[row.type] = row.count;
//     }
//     // Construct the response
//     const response = {
//       totalTickets: parseInt(analytics.totaltickets, 10),
//       closedTickets: parseInt(analytics.closedtickets, 10),
//       openTickets: parseInt(analytics.opentickets, 10),
//       averageCustomerSpending: parseFloat(analytics.averagecustomerspending).toFixed(2),
//       averageTicketsBookedPerDay: parseFloat(analytics.averageticketsbookedperday).toFixed(2),
//       inProgressTickets: parseInt(analytics.inprogresstickets, 10),
//       priorityDistribution,
//       typeDistribution,
//     };
//     return response;
// }
// export const dashboardAnalytics = async (filters: any) => {
//   const params: any[] = [];
//   let query = `
//   SELECT
//     COUNT(*) AS totalTickets,
//     COUNT(*) FILTER (WHERE status = 'closed') AS closedTickets,
//     COUNT(*) FILTER (WHERE status = 'open') AS openTickets,
//     COUNT(*) FILTER (WHERE status = 'in-progress') AS inProgressTickets,
//     AVG(COALESCE(price, 0)) AS averageCustomerSpending,
//     COUNT(*) / GREATEST(DATE_PART('day', NOW() - MIN(created_at)), 1) AS averageTicketsBookedPerDay
//   FROM tickets
//   WHERE 1 = 1
//   ${filters.startDate ? `AND created_at >= $${params.length}` : ''}
//   ${filters.endDate ? `AND created_at <= $${params.length}` : ''}
// `;
//   // Apply filters if present
//   if (filters.startDate) {
//     params.push(filters.startDate);
//     query += ` AND created_at >= $${params.length}`;
//   }
//   if (filters.endDate) {
//     params.push(filters.endDate);
//     query += ` AND created_at <= $${params.length}`;
//   }
//   if (filters.status) {
//     params.push(filters.status);
//     query += ` AND status = $${params.length}`;
//   }
//   if (filters.priority) {
//     params.push(filters.priority);
//     query += ` AND priority = $${params.length}`;
//   }
//   if (filters.type) {
//     params.push(filters.type);
//     query += ` AND type = $${params.length}`;
//   }
//   if (filters.venue) {
//     params.push(filters.venue);
//     query += ` AND venue = $${params.length}`;
//   }
//   // Execute the base query for ticket counts and averages
//   const result = await pool.query(query, params);
//   const analytics = result.rows[0];
//   // Query for priority distribution
//   const priorityQuery = `
//   SELECT
//     priority,
//     COUNT(*) AS count,
//     CASE
//       WHEN DATE_PART('day', NOW() - MIN(created_at)) <= 0 THEN COUNT(*) / 1
//       ELSE COUNT(*) / DATE_PART('day', NOW() - MIN(created_at))
//     END AS averageTicketsBookedPerDay
//   FROM tickets
//   WHERE 1 = 1
//   ${filters.startDate ? `AND created_at >= $1` : ''}
//   ${filters.endDate ? `AND created_at <= $2` : ''}
//   GROUP BY priority
// `;
//   const priorityParams = filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : [];
//   const priorityResult = await pool.query(priorityQuery, priorityParams);
//   const priorityDistribution:any = {};
//   for (const row of priorityResult.rows) {
//     priorityDistribution[row.priority] = row.count;
//     priorityDistribution[`average${row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}TicketsBookedPerDay`] = parseFloat(row.averageticketsbookedperday).toFixed(2);
//   }
//   // Query for type distribution
//   const typeQuery = `
//       SELECT
//         type,
//         COUNT(*) AS count
//       FROM tickets
//       WHERE 1 = 1
//       ${filters.startDate ? `AND created_at >= $1` : ''}
//       ${filters.endDate ? `AND created_at <= $2` : ''}
//       GROUP BY type
//     `;
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
//     averageTicketsBookedPerDay: analytics.averageticketsbookedperday ? parseFloat(analytics.averageticketsbookedperday).toFixed(2) : "0.00",
//     inProgressTickets: parseInt(analytics.inprogresstickets, 10),
//     priorityDistribution,
//     typeDistribution,
//   };
//   return response;
// }
const dashboardAnalytics = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    let query = `
      SELECT
        COUNT(*) AS totalTickets,
        COUNT(*) FILTER (WHERE status = 'closed') AS closedTickets,
        COUNT(*) FILTER (WHERE status = 'open') AS openTickets,
        COUNT(*) FILTER (WHERE status = 'in-progress') AS inProgressTickets,
        COALESCE(AVG(price), 0) AS averageCustomerSpending,
        COALESCE(COUNT(*) / GREATEST(DATE_PART('day', NOW() - MIN(created_at)), 1), 0) AS averageTicketsBookedPerDay
      FROM tickets
      WHERE 1 = 1
    `;
    const params = [];
    // Apply filters if present
    if (filters.startDate) {
        params.push(filters.startDate);
        query += ` AND created_at >= $${params.length}`;
    }
    if (filters.endDate) {
        params.push(filters.endDate);
        query += ` AND created_at <= $${params.length}`;
    }
    if (filters.status) {
        params.push(filters.status);
        query += ` AND status = $${params.length}`;
    }
    if (filters.priority) {
        params.push(filters.priority);
        query += ` AND priority = $${params.length}`;
    }
    if (filters.type) {
        params.push(filters.type);
        query += ` AND type = $${params.length}`;
    }
    if (filters.venue) {
        params.push(filters.venue);
        query += ` AND venue = $${params.length}`;
    }
    // Execute the base query for ticket counts and averages
    const result = yield database_1.default.query(query, params);
    const analytics = result.rows[0];
    // Query for priority distribution
    const priorityQuery = `
      SELECT
        priority,
        COUNT(*) AS count,
        COALESCE(COUNT(*) / GREATEST(DATE_PART('day', NOW() - MIN(created_at)), 1), 0) AS averageTicketsBookedPerDay
      FROM tickets
      WHERE 1 = 1
      ${filters.startDate ? `AND created_at >= $1` : ''}
      ${filters.endDate ? `AND created_at <= $2` : ''}
      GROUP BY priority
    `;
    const priorityParams = filters.startDate && filters.endDate ? [filters.startDate, filters.endDate] : [];
    const priorityResult = yield database_1.default.query(priorityQuery, priorityParams);
    const priorityDistribution = {};
    for (const row of priorityResult.rows) {
        priorityDistribution[row.priority] = row.count;
        priorityDistribution[`average${row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}TicketsBookedPerDay`] = parseFloat(row.averageticketsbookedperday).toFixed(2);
    }
    // Query for type distribution
    const typeQuery = `
      SELECT
        type,
        COUNT(*) AS count
      FROM tickets
      WHERE 1 = 1
      ${filters.startDate ? `AND created_at >= $1` : ''}
      ${filters.endDate ? `AND created_at <= $2` : ''}
      GROUP BY type
    `;
    const typeResult = yield database_1.default.query(typeQuery, priorityParams);
    const typeDistribution = {};
    for (const row of typeResult.rows) {
        typeDistribution[row.type] = row.count;
    }
    // Construct the response
    const response = {
        totalTickets: parseInt(analytics.totaltickets, 10),
        closedTickets: parseInt(analytics.closedtickets, 10),
        openTickets: parseInt(analytics.opentickets, 10),
        averageCustomerSpending: parseFloat(analytics.averagecustomerspending).toFixed(2),
        averageTicketsBookedPerDay: parseFloat(analytics.averageticketsbookedperday).toFixed(2),
        inProgressTickets: parseInt(analytics.inprogresstickets, 10),
        priorityDistribution,
        typeDistribution,
    };
    return response;
});
exports.dashboardAnalytics = dashboardAnalytics;
