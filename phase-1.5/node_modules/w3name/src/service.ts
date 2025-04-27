import throttledQueue from 'throttled-queue'

const RATE_LIMIT_REQUESTS = 30
const RATE_LIMIT_PERIOD = 10 * 1000

export interface PublicService {
  endpoint: URL
  rateLimiter?: RateLimiter
}

/**
 * RateLimiter returns a promise that resolves when it is safe to send a request
 * that does not exceed the rate limit.
 */
export type RateLimiter = () => Promise<void>

function createRateLimiter (): RateLimiter {
  const throttle = throttledQueue(RATE_LIMIT_REQUESTS, RATE_LIMIT_PERIOD)
  return async () => await throttle(() => {})
}

/**
 * W3NameService coordinates access to the W3name API.
 */
export default class W3NameService implements PublicService {
  endpoint: URL
  waitForRateLimit: RateLimiter

  constructor (
    endpoint: URL = new URL('https://name.web3.storage/'),
    waitForRateLimit: RateLimiter = createRateLimiter()
  ) {
    this.endpoint = endpoint
    this.waitForRateLimit = waitForRateLimit
  }
}
