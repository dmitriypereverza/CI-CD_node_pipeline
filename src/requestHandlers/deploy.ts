import { Request, Response } from "express";
import { Error } from "nodegit";
import rimraf from "rimraf";
import NodeSsh from "node-ssh";

import { emitter } from "../eventHandlers";
import { validate } from "../JsonValidators";
import { buildProjectConfig } from "../config/projectConfigBuilder";
import db from "../Storage";

const Git = require("nodegit");

const ssh = new NodeSsh();

const deploy = async function deploy({ body: { ref, repository: { clone_url } } }: Request, res: Response){
  // TODO по гиту определить проект
  const project = await db.findOne({ git: clone_url });


  let config = await getProjectConfig(clone_url, res);

  // TODO проверить объект



  const validationResponse = validate(config, require("../jsonSchemas/client_config.json"));
  if (!validationResponse.isValid) {
    emitter.emit('notify.user', 'disel920@gmail.com',
      `Получен невалидный конфиг файл проекта. Ошибки: ${JSON.stringify(validationResponse.errors)}`
    );
    res.send(`Project config not valid. Errors: ${JSON.stringify(validationResponse.errors)}`);
    return;
  }

  let builderConfig = null;
  try {
    builderConfig = buildProjectConfig(config, project.privateParam);
  } catch (e) {
    emitter.emit('notify.user', 'disel920@gmail.com', e.message);
    res.send(e.message);
    return;
  }

  // TODO тут должны определить в какую ветку произвести деплой
  const target = builderConfig.targets.find(target => `refs/heads/${target.branch}` === ref);

  ssh.connect({
    host: target.deploy.ssh.host,
    username: target.deploy.ssh.username,
    port: target.deploy.ssh.port,
    password: target.deploy.ssh.pass,
    tryKeyboard: true,
    onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
        finish([target.deploy.ssh.pass])
      }
    }
  }).then(() => {
    ssh.execCommand(target.deploy.command, { cwd: target.deploy.ssh.cwd })
      .then(function(result) {
        emitter.emit('notify.user', target.notification.email,
          'STDOUT: ' + result.stdout + "\nSTDERR: " + result.stderr);
        res.send(JSON.stringify({ success: true }));
      });
    }).catch(function (err) {
      emitter.emit('notify.user', target.notification.email, 'Проблема подключения к удаленному серверу: ' + err);
      res.send(JSON.stringify({
        success: false,
        error: 'Проблема подключения к удаленному серверу: ' + err,
      }));
    });
};

function getProjectConfig (git, res: Response) {
  rimraf.sync("tmp");
  return Git.Clone(git, "tmp")
    .then(repo => repo.getMasterCommit())
    .then(commit => commit.getEntry("project.conf.json"))
    .then(entry => entry.getBlob().then(blob => {
        blob.entry = entry;
        return blob;
      })
    )
    .then(function (blob) {
      return String(blob);
    }).then(json => {
      return JSON.parse(json)
    })
    .catch(function (err: Error) {
      res.send(JSON.stringify({
        success: false,
        error: err.message,
      }));
    })
}

export default deploy;
