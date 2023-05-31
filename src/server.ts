import fastify from 'fastify'
import { knex } from './database'

const app = fastify()

app.get('/hello', async () => {
  return knex('sqlite_schema').select('*')
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('Servidor incianod')
  })
