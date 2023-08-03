
import path = require("path");
import { Server } from "http";

import { initApp } from "./app";

// start server
const port = parseInt(process.env.PORT + "");
const host = process.env.HOST + "";

let server: Server<any, any>

(async function main() {
  const app = await initApp()
  app.on("error", (err) => {
    console.error(err);
  });
  app.on("close", ()=>{
    console.log('closing down server');
  });
  server = app.listen(port, host, () => {
    app.emit('listening');
    console.log("Server listening at " + port);
  });

  const close = ()=>{
    app.emit('close');
    server.close();
  }

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
})();
