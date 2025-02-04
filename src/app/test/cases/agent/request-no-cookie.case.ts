import { assertToBeFalsy } from '../../service/assert'
import { TestCase } from '../../types/testCase'
import { getApiKey } from '../../utils/getApiKey'

const testCase: TestCase = {
  name: 'agent request no cookie',
  test: async (api) => {
    const query = new URLSearchParams()
    query.set('apiKey', getApiKey())
    const { requestFromProxy } = await api.sendRequestToCdn(query, {
      headers: { cookie: 'test=123; _iidt=test' },
    })
    assertToBeFalsy('cookie', requestFromProxy.get('cookie'))
  },
}

export default testCase
