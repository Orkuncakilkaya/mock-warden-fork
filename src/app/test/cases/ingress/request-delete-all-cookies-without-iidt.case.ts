import { assert } from '../../service/assert'
import { TestCase } from '../../types/testCase'

const testCase: TestCase = {
  name: 'ingress delete all cookies if iidt not present',
  test: async (api) => {
    const { requestFromProxy } = await api.sendRequestToIngress({
      headers: {
        cookie: 'random=123;test=123',
      },
    })
    assert(requestFromProxy.get('cookie'), undefined)
  },
}

export default testCase
