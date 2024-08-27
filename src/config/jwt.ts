import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: '1h',
  })
}

const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string)
}

export { generateToken, verifyToken }
