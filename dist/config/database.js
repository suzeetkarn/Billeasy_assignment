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
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
// Initialize the database schema if necessary
const initializeSchema = () => __awaiter(void 0, void 0, void 0, function* () {
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;
    const createTicketsTable = `
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      venue VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      priority VARCHAR(50) NOT NULL,
      due_date TIMESTAMP NOT NULL,
      created_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    const createTicketAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id SERIAL PRIMARY KEY,
      ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        yield pool.query(createUsersTable);
        yield pool.query(createTicketsTable);
        yield pool.query(createTicketAssignmentsTable);
        console.log('Schema initialized successfully.');
    }
    catch (error) {
        console.error('Error initializing schema:', error);
    }
});
// Call initializeSchema if running in development mode or when needed
if (process.env.NODE_ENV === 'development') {
    initializeSchema().catch(console.error);
}
exports.default = pool;
