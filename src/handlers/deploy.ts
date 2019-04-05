import childProcess from "child_process";

export default function deploy(req, res){
  childProcess.exec('ls -la', function(err, stdout, stderr){
    if (err) {
      console.error(err);
      return res.send(500);
    }
    res.send(stdout);
  });
}
