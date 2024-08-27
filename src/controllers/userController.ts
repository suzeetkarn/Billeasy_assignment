import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { createUser, findUserByEmail } from '../models/userModel'

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, type, password } = req.body

  if (!name || !email || !type || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await createUser(name, email, type, hashedPassword)

  return res.status(201).json(user)
}
