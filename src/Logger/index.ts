import log4js from "log4js";

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'data/log/app.log' },
    console: { type: 'console' }
  },
  categories: {
    default: {
      appenders: ['file', 'console'],
      level: 'trace'
    }
  }
});

export const logger = log4js.getLogger();
