import { Request, Response } from "express";

import registerHandler from "../handlers/register";
import deployHandler from "../handlers/deploy";

interface RouteInterface {
  type: "POST" | "GET" | "PUT" | "DELETE";
  path: String,
  handler: (req: Request, res: Response) => void,
  validationSchema: any
}

export default [
  {
    path: '/register',
    type: 'POST',
    handler: registerHandler,
    validationSchema: require("./schemas/register.json")
  },
  {
    path: '/command',
    type: 'POST',
    handler: function () {

    },
    validationSchema: require("./schemas/command.json")
  },
  {
    path: '/webhook',
    type: 'POST',
    handler: deployHandler,
    validationSchema: require("./schemas/webhook.json")
  },
] as RouteInterface[];
