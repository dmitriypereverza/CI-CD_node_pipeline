import { Request, Response } from "express";
import db from "../Storage";

export const registerProject = async ({ body }: Request, res: Response) => {
  const document = await db.findOne({ project: body.project });
  if (document) {
    res.send(`Проект с именем ${body.project} уже зарегистрирован.`);
    return;
  }

  db.insert(body)
    .then(() => res.send(`Проект зарегистрирован.`))
    .catch(err => {
    if (err) {
      res.send(`Ошибка при сохранении проекта "${body.project}": ${err}`);
      return;
    }
  });
};

export const updateProject = async ({ body }: Request, res: Response) => {
  const document = await db.findOne({ project: body.project });
  if (!document) {
    res.send(`Проект с именем "${body.project}" не зарегистрирован.`);
    return;
  }

  db.update({ _id: document._id }, { $inc: { ...body.updatedParams } })
    .then(() => res.send(`Проект обновлен.`))
    .catch(err => {
      if (err) {
        res.send(`Ошибка при обновлении конфигурации проекта "${document.project}": ${err}`);
        return;
      }
    });
};

export const getProject = async ({ body }: Request, res: Response) => {
  const document = await db.find({ project: body.project });
  if (!document) {
    res.send(`Проект с именем "${body.project}" не зарегистрирован.`);
    return;
  }

  res.send(JSON.stringify(document));
};

