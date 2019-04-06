import nodemailer, { SentMessageInfo } from "nodemailer";
import { config } from "../config/config"

function getMailer() {
  return nodemailer.createTransport(config.masterEmailSettings);
}

export const sendMail = async (email, text, isError = false) => {
  return await getMailer().sendMail({
    from: config.masterEmailSettings.auth.user,
    to: email,
    subject: isError
      ? 'Ошибка CI/CD сервиса'
      : "Информационное сообщение из CI/CD сервиса",
    text,
  }) as SentMessageInfo;
};
