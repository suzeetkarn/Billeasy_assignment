// src/app.ts
import express from 'express'
import userRoutes from './routes/userRoutes'
import authRoutes from './routes/authRoutes'
import ticketRoutes from './routes/ticketRoutes'

const app = express()

app.use(express.json())

app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)

export default app
