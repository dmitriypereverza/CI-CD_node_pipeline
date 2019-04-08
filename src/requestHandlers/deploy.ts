import { Request, Response } from "express";
import { Error } from "nodegit";
import NodeSsh from "node-ssh";

import { emitter } from "../eventHandlers";
import { validate } from "../JsonValidators";
import { buildProjectConfig } from "../config/projectConfigBuilder";

const Git = require("nodegit");

const ssh = new NodeSsh();

const deploy = async function deploy({ body: { project, git, privateKey } }: Request, res: Response){
  const config = await getProjectConfig(git, res);

  const validationResponse = validate(config, require("../jsonSchemas/client_config.json"));
  if (!validationResponse.isValid) {
    emitter.emit('notify.user',
      `Получен невалидный конфиг файл проекта. Ошибки: ${JSON.stringify(validationResponse.errors)}`
    );
    res.send(`Project config not valid. Errors: ${validationResponse.errors.join(', ')}`);
    return;
  }

  const builderConfig = buildProjectConfig(config, {});
  console.log(builderConfig);

  return;

  ssh.connect({
    host: '194.87.93.250',
    username: 'root',
    port: 22,
    password: 'pbb2c7do',
    tryKeyboard: true,
    onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
        finish(['pbb2c7do'])
      }
    }
  }).then(() => {
    ssh.execCommand('git status', { cwd: '/var/www/parsers' }).then(function(result) {
      console.log('STDOUT: ' + result.stdout);
      if (result.stderr) {
        console.log('STDERR: ' + result.stderr);
      }
    });
  }).catch(function (err) {
    console.log(err);
  });
};

function getProjectConfig (git, res: Response) {
  return Git.Clone(git, "tmp")
    .then(repo => repo.getMasterCommit())
    .then(commit => commit.getEntry("vue.config.js"))
    .then(entry => entry.getBlob().then(blob => {
        blob.entry = entry;
        return blob;
      })
    )
    .then(function (blob) {
      return String(blob);
    })
    .catch(function (err: Error) {
      console.log(err.message);
      res.send(JSON.stringify({
        success: false,
        error: err.message,
      }));
    });
}

export default deploy;
