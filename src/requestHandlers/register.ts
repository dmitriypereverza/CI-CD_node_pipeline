import { Request, Response } from "express";
import db from "../Storage";

const registerProject = async ({ body: { project, git, privateParam } }: Request, res: Response) => {
  const document = await db.findOne({ project });
  if (document) {
    res.send(`Проект с именем ${project} уже зарегистрирован.`);
    return;
  }

  db.insert({ project, git, privateParam })
    .then(() => res.send(`Проект зарегистрирован.`))
    .catch(err => {
    if (err) {
      res.send(`Ошибка при сохранении проекта "${project}": ${err}`);
      return;
    }
  });
};

export default registerProject;
