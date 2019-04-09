import { Request, Response } from "express";
import { Error } from "nodegit";
import NodeSsh from "node-ssh";

import { emitter } from "../eventHandlers";
import { validate } from "../JsonValidators";
import { buildProjectConfig } from "../config/projectConfigBuilder";

const Git = require("nodegit");

const ssh = new NodeSsh();

const deploy = async function deploy({ body: { ref, git_url } }: Request, res: Response){
  const config = await getProjectConfig(git_url, res);

  const validationResponse = validate(config, require("../jsonSchemas/client_config.json"));
  if (!validationResponse.isValid) {
    emitter.emit('notify.user',
      `Получен невалидный конфиг файл проекта. Ошибки: ${JSON.stringify(validationResponse.errors)}`
    );
    res.send(`Project config not valid. Errors: ${validationResponse.errors.join(', ')}`);
    return;
  }

  let builderConfig = null;
  try {
    builderConfig = buildProjectConfig(config, {});
  } catch (e) {
    emitter.emit('notify.user', e.message);
    res.send(e.message);
    return;
  }

  // TODO тут должны определить в какую ветку произвести деплой
  const target = builderConfig.targets.find(target => target.branch === ref);

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
    ssh.execCommand('git status', { cwd: target.deploy.ssh.cwd }).then(function(result) {
      emitter.emit('notify.user', 'STDOUT: ' + result.stdout);
      if (result.stderr) {
        emitter.emit('notify.user', 'STDERR: ' + result.stderr);
      }
    });
  }).catch(function (err) {
    emitter.emit('notify.user', 'Error: ' + err);
  });
};

function getProjectConfig (git, res: Response) {
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
