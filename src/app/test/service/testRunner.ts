import { glob } from 'glob'
import { ProxyRequestType, removeProxyRequestListener } from '../../proxy-receiver/service/proxyRequestHandler'
import { TestCase, TestResult } from '../types/testCase'
import { finalizeTestSession, TestSession } from './session'
import { TestCaseApi } from './TestCaseApi'
import { withTimeout } from '../../../utils/timeout'

const TEST_TIMEOUT_MS = 10_000

export type DetailedTestResult = TestResult & {
  testName: string
  requestDurationMs: number
}

export async function loadTestCases() {
  const caseFiles = await glob('../**/*.case.ts', { absolute: true })
  return caseFiles.map(async (file) => import(file).then((module) => module.default as TestCase))
}

export async function runTests(testSession: TestSession) {
  testSession.start()

  const testCases = await loadTestCases()

  for (const testCase of testCases) {
    const result = await runTest(testSession, await testCase)
    testSession.addResult(result)
  }

  return finalizeTestSession(testSession)
}

export async function runTest(testSession: TestSession, test: TestCase): Promise<DetailedTestResult> {
  const startTime = Date.now()

  const cdnProxyUrl = new URL(testSession.host)
  cdnProxyUrl.pathname = testSession.cdnProxyPath

  const ingressProxyUrl = new URL(testSession.host)
  ingressProxyUrl.pathname = testSession.ingressProxyPath

  const api = new TestCaseApi(ingressProxyUrl, cdnProxyUrl, testSession)

  let result: TestResult

  try {
    await withTimeout(() => test.test(api), TEST_TIMEOUT_MS)

    result = {
      passed: true,
    }
  } catch (error) {
    result = {
      passed: false,
      reason: error instanceof Error ? error.message : String(error),
      meta: {
        error,
        requestsFromProxy: api.requestsFromProxy,
      },
    }
  }

  // In case if test failed without removing listeners
  Object.values(ProxyRequestType).forEach((type) => {
    removeProxyRequestListener(type, testSession.host)
  })

  const requestDurationMs = Date.now() - startTime

  return {
    ...result,
    testName: test.name,
    requestDurationMs,
  }
}
