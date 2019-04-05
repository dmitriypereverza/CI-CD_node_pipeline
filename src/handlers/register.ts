import { Request, Response } from "express";
import db from "../Storage";

export default function deploy({ body: { project, git, privateKey } }: Request, res: Response){

  res.send(git);
}
