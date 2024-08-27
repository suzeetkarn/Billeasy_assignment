// src/controllers/authController.ts
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { findUserByEmail } from '../models/userModel'
import { generateToken } from '../config/jwt'

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid credentials' })
  }

  const token = generateToken(user.id)

  return res.status(200).json({ token })
}
