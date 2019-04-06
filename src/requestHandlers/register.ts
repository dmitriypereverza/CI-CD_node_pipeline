import { Request, Response } from "express";
import db from "../Storage";

const registerProject = ({ body: { project, git, email } }: Request, res: Response) => {
  db.findOne({ project }, (err, document) => {
    if (document) {
      res.send(`Проект с именем ${project} уже зарегистрирован.`);
      return;
    }

    db.insert({ project, git, email }, (err, document) => {
      if (err) {
        res.send(`Ощибка при сохранении проекта "${project}": ${err}`);
        return;
      }
      res.send(`Проект зарегистрирован.`);
    });
  });
};

export default registerProject;
