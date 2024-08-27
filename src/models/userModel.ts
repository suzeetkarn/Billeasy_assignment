import pool from '../config/database'

export const createUser = async (
  name: string,
  email: string,
  type: string,
  hashedPassword: string
) => {
  const result = await pool.query(
    'INSERT INTO users (name, email, type, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
    [name, email, type, hashedPassword]
  )
  return result.rows[0]
}

export const findUserByEmail = async (email: string) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ])
  return result.rows[0]
}

export const findUserById = async (id: string) => {
  const result = await pool.query(
    'SELECT id, name, email FROM users WHERE id = $1',
    [id]
  )
  return result.rows[0]
}
