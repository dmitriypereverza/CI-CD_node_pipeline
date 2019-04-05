import express, { Request, Response } from 'express';
import routers from "./router/router";
import { getValidateFunc } from "./JsonValidators"
const app = express();

app.use(express.json());
app.use(express.urlencoded());

routers.forEach(route => {
  app[route.type.toLowerCase()](route.path, function (req: Request, res: Response) {
    const validate = getValidateFunc(route.validationSchema);
    const valid = validate(req.body);
    if (!valid) {
      res.send(JSON.stringify(validate.errors.map(item => item.message)));
    }
    route.handler(req, res);
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`CI/CD service listening on port ${port}!`));
