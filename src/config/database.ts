import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
})

const initializeSchema = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(50) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `

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
  `

  const createTicketAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      id SERIAL PRIMARY KEY,
      ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  try {
    await pool.query(createUsersTable)
    await pool.query(createTicketsTable)
    await pool.query(createTicketAssignmentsTable)
    console.log('Schema initialized successfully.')
  } catch (error) {
    console.error('Error initializing schema:', error)
  }
}

if (process.env.NODE_ENV === 'development') {
  initializeSchema().catch(console.error)
}

export default pool
