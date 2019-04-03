"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = __importDefault(require("child_process"));
const app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded());
app.get('/', (req, res) => {
    res.send(JSON.stringify(req.query));
});
app.post('/webhooks', (req, res) => {
    const branch = req.body.ref;
    deploy(res);
    // res.send(JSON.stringify(req.body))
});
function deploy(res) {
    child_process_1.default.exec('ls -la', function (err, stdout, stderr) {
        if (err) {
            console.error(err);
            return res.send(500);
        }
        res.send(stdout);
    });
}
app.listen(80, () => console.log('CI service listening on port 3000!'));
//# sourceMappingURL=server.js.map
