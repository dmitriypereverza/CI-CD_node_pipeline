import EventEmitter from "events";
import * as Mailer from "../Mailer";
import { logger } from "../Logger";

export const emitter = new EventEmitter();

emitter.on('notify.user', (email, text) => {
  Mailer.sendMail(email, text)
    .then(data => logger.info(`Success send mail on ${email}`))
    .catch(err => logger.error(`Error send mail on ${email}: ${err}`));
});

emitter.on('log', data => logger.error(data));
