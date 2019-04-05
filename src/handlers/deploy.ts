import { Request, Response } from "express";
import { Error } from "nodegit";
const Git = require("nodegit");

export default function deploy({ body: { project, git, privateKey } }: Request, res: Response){
  Git.Clone(git, "tmp")
    .then(repo => repo.getMasterCommit())
    .then(commit => commit.getEntry("vue.config.jsp"))
    .then(entry => entry.getBlob().then(blob => {
        blob.entry = entry;
        return blob;
      })
    )
    .then(function(blob) {
      res.send(String(blob));
    })
    .catch(function(err: Error) {
      console.log(err.message);
      res.send(JSON.stringify({
        success: false,
        error: err.message,
      }));
    });
}
