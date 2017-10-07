const finalhandler = require("finalhandler");
const http = require("http");
const serveStatic = require("serve-static");

const serve = serveStatic("./", {});

const port = 3000;

const server = http.createServer(
    (request, response) => {
        serve(request, response, finalhandler(request, response));
    }
);

console.log(`Starting server on localhost:${port}`);

server.listen(port);
