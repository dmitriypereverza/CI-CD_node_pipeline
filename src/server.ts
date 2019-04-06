import express, { Request, Response } from 'express';
import routers from "./router/router";
import { getValidateFunc } from "./JsonValidators"

require("./eventHandlers/index");

const app = express();

app.use(express.json());
app.use(express.urlencoded());

routers.forEach(route => {
  app[route.type.toLowerCase()](route.path, function (req: Request, res: Response) {
    if (route.validationSchema) validate(req, res, route.validationSchema);
    route.handler(req, res);
  });
});

function validate (req, res, validationSchema) {
  const validate = getValidateFunc(validationSchema);
  const valid = validate(req.body);
  if (!valid) {
    res.send(JSON.stringify(validate.errors.map(item => item.message)));
  }
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`CI/CD service listening on port ${port}!`));
