import { Request, Response } from "express";

import registerHandler from "../requestHandlers/register";
import deployHandler from "../requestHandlers/deploy";

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
    validationSchema: require("../jsonSchemas/register.json")
  },
  {
    path: '/command',
    type: 'POST',
    handler: function () {

    },
    validationSchema: require("../jsonSchemas/command.json")
  },
  {
    path: '/webhook',
    type: 'POST',
    handler: deployHandler,
    validationSchema: require("../jsonSchemas/webhook.json")
  },
] as RouteInterface[];
