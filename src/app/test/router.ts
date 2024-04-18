import * as express from 'express'
import { RunTestsRequestSchema } from './request.types'
import { createTestSession } from './service/session'
import { runTests } from './service/testRunner'
import { validateRequest } from 'zod-express-middleware'

const RunTestsSchema = validateRequest({
  body: RunTestsRequestSchema,
})

export function testRouter() {
  const router = express.Router()

  router.post('/run-tests', RunTestsSchema, async (req, res) => {
    try {
      const testSession = createTestSession(req.body)

      const result = await runTests(testSession)

      return res.json(result.toTestResponse())
    } catch (e) {
      res.status(500).send({ reason: e.message })
    }
  })

  return router
}
