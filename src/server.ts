import express, { Request, Response } from 'express';
import routers from "./router/router";
import * as JsonValidators from "./JsonValidators"

require("./eventHandlers/index");

const app = express();

app.use(express.json());
app.use(express.urlencoded());

routers.forEach(route => {
  app[route.type.toLowerCase()](route.path, async function (req: Request, res: Response) {
    if (route.validationSchema) {
      const validate = JsonValidators.validate(req.body, route.validationSchema);
      if (!validate.isValid) {
        res.send(JSON.stringify(validate.errors));
        return;
      }
    }

    let result = '';
    try {
      if (route.async) {
        route.handler(req, res);
      } else {
        result = await route.handler(req, res);
      }
    } catch (e) {
      res.send(JSON.stringify({
        success: false,
        error: e.message
      }))
    }

    return res.send(JSON.stringify({
      success: true,
      payload: result
    }))
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`CI/CD service listening on port ${port}!`));
