import { Request } from "express";
import db from "../Storage";

export const registerProject = async ({ body }: Request) => {
  const document = await db.findOne({ project: body.project });
  if (document) {
    throw new Error(`Проект с именем ${body.project} уже зарегистрирован.`);
  }

  try {
    const doc = await db.insert(body);
    return `Проект зарегистрирован. \n${JSON.stringify(doc)}`;
  } catch (err) {
    throw new Error(`Ошибка при сохранении проекта "${body.project}": ${err}`);
  }
};

export const updateProject = async ({ body }: Request) => {
  const document = await db.findOne({ project: body.project });
  if (!document) {
    throw new Error(`Проект с именем "${body.project}" не зарегистрирован.`);
  }

  try {
    const doc = await db.update({ _id: document._id }, { $set: { ...body.updatedParams } }, { returnUpdatedDocs: true });
    return `Проект обновлен. \n${JSON.stringify(doc)}`;
  } catch (err) {
    throw new Error(`Ошибка при обновлении конфигурации проекта "${document.project}": ${err}`);
  }
};

export const getProject = async ({ body }: Request) => {
  const document = await db.find({ project: body.project });
  if (!document) {
    throw new Error(`Проект с именем "${body.project}" не зарегистрирован.`);
  }

  return document;
};

