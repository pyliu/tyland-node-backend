const config = {
  isDev: process.env.NODE_ENV !== 'production',
  connUri: `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:27017/tyland`,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  userCollection: 'user',
  caseCollection: 'case',
  statusCode: {
    SUCCESS: 1,
    FAIL: 0,
    FAIL_AUTH: -1,
    FAIL_NOT_FOUND: -2,
    FAIL_DUPLICATED: -3,
    FAIL_EXPIRE: -4,
    FAIL_NOT_IMPLEMENTED: -5,
    FAIL_NOT_CHANGED: -6
  }
}

module.exports = config;
