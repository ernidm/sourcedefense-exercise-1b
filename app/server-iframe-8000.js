let { log } = console;

let path = require("path");
let express = require("express");
let http = require("http");
let app = express();
let router = express.Router();
let server;

let indexRouter = router.get("/:var(|index-iframe-8000|index-iframe-8000.html)?", (req, res) => {
	res.sendFile(__dirname + "/public/index-iframe-8000.html");
});

const PORT = 8000;
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.static(PUBLIC_DIR));
app.use("/", indexRouter);

app.set("port", PORT);

server = http.createServer(app);
server.listen(PORT, () => log(`listening on port ${PORT}`));