const config = {
  isDev: process.env.NODE_ENV !== 'production',
  connUri: `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:27017/tyland`,
  dbUsername: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  userCollection: 'user'
}

module.exports = config;
