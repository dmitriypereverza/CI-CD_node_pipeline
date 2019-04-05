import { Request, Response } from "express";
import { Error } from "nodegit";
import NodeSsh from "node-ssh";
const Git = require("nodegit");

const ssh = new NodeSsh();

export default function deploy({ body: { project, git, privateKey } }: Request, res: Response){
  getProjectConfig(git, res)
    .then(config => {
      console.log(config);

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
      }).then(function() {
        ssh.execCommand('git status', { cwd: '/var/www/parsers' }).then(function(result) {
          console.log('STDOUT: ' + result.stdout);
          if (result.stderr) {
            console.log('STDERR: ' + result.stderr);
          }
        });
      }).catch(function (err) {
        console.log(err);
      });
    });
}

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
