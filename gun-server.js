const Gun = require("gun")
const web = require("http")
  .createServer()
  .listen(4444);

const radisk = false

if (radisk) {
  new Gun({ web, radisk: true });
} else {
  require("@notabug/gun-lmdb").attachToGun(Gun, {
    path: "./",
    mapSize: 1024**4 // Maximum size of database in bytes
  });
  new Gun({ web, radisk: false });
}

