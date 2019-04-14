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

const deploy = async function deploy({ body: { ref, after: currentCommit, repository: { clone_url } } }: Request, res: Response) {
  // Сразу возвращаем ответ на запрос от хуки git хостинга
  res.send();

  const project = await db.findOne({ git: clone_url });
  if (!project) {
    emitter.emit('log.error', `Не зарегистрирован проект для репозитория ${clone_url}`);
    return;
  }

  // Передаем в каррированную ф-цию email пользователей
  const sendEmails = notifyUsers(project.notificationEmails);

  let config = await getProjectConfig(project);
  if (!config) {
    sendEmails(`Не удалось получить конфиг проекта ${project.project}. Проверте настройки проекта.`);
    return;
  }

  const validationResponse = validate(config, require("../jsonSchemas/client_config.json"));
  if (!validationResponse.isValid) {
    sendEmails(`Получен невалидный конфиг файл проекта. Ошибки: ${JSON.stringify(validationResponse.errors)}`);
    return;
  }

  let builderConfig = null;
  try {
    builderConfig = buildProjectConfig(config, project.privateParam);
  } catch (e) {
    sendEmails(`Произошли ошибки при сборке файла конфигурации: ${e.message}`);
    return;
  }

  const target = builderConfig.targets.find(target => `refs/heads/${target.branch}` === ref);
  if (!target) {
    return;
  }

  // Создаем ф-цию выполнения команд на сервере
  const execSshCommand = execCommand(target.deploy.ssh.cwd);

  connectToServer(target.deploy.ssh)
    .then(async () => {
      // Очищаем проект в нужной ветке
      await execSshCommand(`git checkout ${target.branch} | git reset --hard`);

      // Тянем изменения
      const pullResult = await execSshCommand(`git pull origin ${target.branch}`);
      if (pullResult.code !== 0) {
        sendEmails(`Не удалось получить последнюю версию проекта: ${pullResult.stderr}`);
        await execSshCommand(`git reset --hard ${project.lastSuccessCommit}`);
        return;
      }

      // Выполняем тесты
      const testResult = await execSshCommand(target.testCommand);
      if (testResult.code !== 0) {
        sendEmails(`Тесты провалились: ${testResult.stderr}`);
        await execSshCommand(`git reset --hard ${project.lastSuccessCommit}`);
        return;
      }

      // Выполняем команду сборки
      const deployResult = await execSshCommand(target.deploy.command);
      const output = deployResult.stdout + deployResult.stderr;
      if (deployResult.code === 0) {
        sendEmails(`Проект успешно собран.\n ${output}`);
        // Обновляем хэш последнего успешного коммита
        db.update({ _id: project._id }, { $set: { lastSuccessCommit: currentCommit }});
      } else {
        sendEmails(`Произошли ошибки при сборке проекта.\n ${output}`);
        await execSshCommand(`git reset --hard ${project.lastSuccessCommit}`);
        await execSshCommand(target.deploy.command);
      }
      return;

    }).catch(function (err) {
      sendEmails(`Проблема подключения к удаленному серверу: ${err}`);
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

function getProjectConfig (project) {
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
    })
}

function execCommand (cwd) {
  return command => ssh.execCommand(command, { cwd });
}

function notifyUsers (notificationEmails) {
  return msg => emitter.emit('notify.user', notificationEmails, msg);
}
export default deploy;
