import EventEmitter from "events";
import * as Mailer from "../Mailer";
import { logger } from "../Logger";

export const emitter = new EventEmitter();

emitter.on('notify.user', (email, text) => {
  Mailer.sendMail(email, text)
    .then(data => logger.info(`Success send mail on ${email}`))
    .catch(err => logger.error(`Error send mail on ${email}: ${err}`));
});

emitter.on('log.info', data => logger.info(data));
emitter.on('log.error', data => logger.error(data));
emitter.on('user.error', data => logger.error(data));
