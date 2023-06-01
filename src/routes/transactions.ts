import { randomUUID } from 'crypto'
import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import checkSessionIdExists from '../middlewares/check-session-id-exists'

export async function transactionRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies
      const transactions = await knex('transactions')
        .select()
        .where('session_id', sessionId)

      return { transactions }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies
      const schema = z.object({
        id: z.string().uuid(),
      })
      const { id } = schema.parse(req.params)
      const transaction = await knex('transactions')
        .select()
        .where({ id, session_id: sessionId })
        .first()

      return { transaction }
    },
  )

  app.get('/summary', async (req) => {
    const summary = await knex('transactions').sum('amount', { as: 'amount' })

    return { summary }
  })

  app.post('/', async (req, res) => {
    const bodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = bodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
    }

    res.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days.
    })

    await knex('transactions')
      .insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })
      .returning('*')

    return res.status(201).send()
  })
}
