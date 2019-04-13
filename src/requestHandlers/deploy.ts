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

const deploy = async function deploy({ body: { ref, after: currentCommit, repository: { clone_url } } }: Request, res: Response){
  const project = await db.findOne({ git: clone_url });
  if (!project) {
    emitter.emit('log.error', `Не зарегистрирован проект для репозитория ${clone_url}`);
    res.send();
    return;
  }

  let config = await getProjectConfig(project, res);
  if (!config) {
    emitter.emit('notify.user', project.notificationEmails,
      `Не удалось получить конфиг проекта ${project.project}. Проверте настройки проекта.`
    );
    res.send();
    return;
  }

  const validationResponse = validate(config, require("../jsonSchemas/client_config.json"));
  if (!validationResponse.isValid) {
    emitter.emit('notify.user', project.notificationEmails,
      `Получен невалидный конфиг файл проекта. Ошибки: ${JSON.stringify(validationResponse.errors)}`
    );
    res.send();
    return;
  }

  let builderConfig = null;
  try {
    builderConfig = buildProjectConfig(config, project.privateParam);
  } catch (e) {
    emitter.emit('notify.user', project.notificationEmails, `Произошли ошибки при сборке файла конфигурации: ${e.message}`);
    res.send();
    return;
  }

  const target = builderConfig.targets.find(target => `refs/heads/${target.branch}` === ref);
  if (!target) {
    res.send();
    return;
  }

  connectToServer(target.deploy.ssh)
    .then(async () => {
      // Очищаем проект в нужной ветке
      await ssh.execCommand(`git checkout ${target.branch} | git reset --hard`, { cwd: target.deploy.ssh.cwd });

      // Тянем изменения
      const pullResult = await ssh.execCommand(`git pull origin ${target.branch}`, { cwd: target.deploy.ssh.cwd });
      if (pullResult.code !== 0) {
        console.log('pullResult', pullResult);
        emitter.emit('notify.user', project.notificationEmails, `Не удалось получить последнюю версию проекта: ${pullResult.stderr}`);

        await ssh.execCommand(`git reset --hard ${project.lastSuccessCommit}`, { cwd: target.deploy.ssh.cwd });
        res.send();
        return;
      }

      // Выполняем тесты
      const testResult = await ssh.execCommand(target.testCommand, { cwd: target.deploy.ssh.cwd });
      if (testResult.code !== 0) {
        console.log('testResult', testResult);
        emitter.emit('notify.user', project.notificationEmails, `Тесты провалились: ${testResult.stderr}`);

        await ssh.execCommand(`git reset --hard ${project.lastSuccessCommit}`, { cwd: target.deploy.ssh.cwd });
        res.send();
        return;
      }

      // Выполняем команду сборки
      const deployResult = await buildProject(target.deploy);
      console.log('deployResult', deployResult);
      if (deployResult.code === 0) {
        emitter.emit('notify.user', project.notificationEmails,
          `Проект успешно собран.\n ${deployResult.stdout}`
        );
        // Обновляем хэш последнего успешного коммита
        db.update({ _id: project._id }, { $set: { lastSuccessCommit: currentCommit }});
      } else {
        emitter.emit('notify.user', project.notificationEmails,
          `Произошли ошибки при сборке проекта.\n ${deployResult.stderr}`
        );
        await ssh.execCommand(`git reset --hard ${project.lastSuccessCommit}`, { cwd: target.deploy.ssh.cwd });
        await buildProject(target.deploy);
      }
      res.send();
      return;

    }).catch(function (err) {
      emitter.emit('notify.user', project.notificationEmails, `Проблема подключения к удаленному серверу: ${err}`);
      res.send();
    });
};

function connectToServer (sshConfig) {
  const { host, username, port, pass } = sshConfig;
  return ssh.connect({
    host: host,
    username: username,
    port: port,
    password: pass,
    tryKeyboard: true,
    onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
      if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
        finish([pass])
      }
    }
  })
}

function getProjectConfig (project, res: Response) {
  return Git.Clone(project.git, "tmp")
    .then(repo => repo.getMasterCommit())
    .then(commit => commit.getEntry("project.conf.json"))
    .then(entry => entry.getBlob()
      .then(blob => {
        blob.entry = entry;
        return blob;
      })
    )
    .then(blob => String(blob))
    .then(json => {
      rimraf.sync("tmp");
      return JSON.parse(json)
    })
    .catch(function (err: Error) {
      emitter.emit(project.notificationEmails, `Произошли ошибка при скачивании репозитория: [${err.message}]`);
      rimraf.sync("tmp");
      res.send();
    })
}

function buildProject (deployConfig) {
  return ssh.execCommand(deployConfig.command, { cwd: deployConfig.ssh.cwd });
}

export default deploy;
