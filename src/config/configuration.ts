export default () => ({
  app: {
    timezone: process.env.APP_TIMEZONE ?? 'UTC',
  },
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/family-expenses',
  },
  telegram: {
    token: process.env.BOT_TOKEN ?? '',
  },
});
