import express, { Request } from 'express';
import childProcess from 'child_process';

const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req: Request, res) => {
  res.send(JSON.stringify(req.query))
});
app.post('/webhooks', (req: Request, res) => {
  const branch = req.body.ref;
  console.log(req.body);
  deploy(res);
  // res.send(JSON.stringify(req.body))
});


function deploy(res){
  childProcess.exec('ls -la', function(err, stdout, stderr){
    if (err) {
      console.error(err);
      return res.send(500);
    }
    res.send(stdout);
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`CI service listening on port ${port}!`));
