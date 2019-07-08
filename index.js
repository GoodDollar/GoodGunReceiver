/* globals Promise */
const R = require("ramda");
const {
  chainInterface,
  Receiver,
  deduplicateMessages,
  allowLeech,
  relayMessages,
  cluster,
  websocketTransport
} = require("@notabug/gun-receiver");
const { createSuppressor } = require("@notabug/gun-suppressor");
const { PERMISSIVE_SCHEMA } = require("@notabug/gun-suppressor-sear");
const { receiver: lmdb } = require("@notabug/gun-lmdb");

const Gun = require("gun/gun");
const suppressor = createSuppressor(Gun, PERMISSIVE_SCHEMA);

const validateMessage = ({ json, skipValidation, ...msg }) => {
  if (skipValidation) return { ...msg, json };

  return suppressor.validate(json).then(validated => {
    if (!validated) return console.error(suppressor.validate.errors, json);
    return { ...msg, json: validated };
  });
};

const lmdbConf = { path: "lmdbdata", mapSize: 1024 ** 3 }; // mapSize is max size of db

const lmdbSupport = R.pipe(
  lmdb.respondToGets(Gun, { disableRelay: true }, lmdbConf),
  chainInterface,
  lmdb.acceptWrites(Gun, { disableRelay: true }, lmdbConf)
);

const runServer = opts =>
  R.pipe(
    Receiver,
    db => db.onIn(validateMessage) && db,
    deduplicateMessages,
    db => {
      db.onIn(msg => {
        if (msg && msg.json && (msg.json.leech || msg.json.ping || msg.json.ok))
          return;
        return msg;
      });
      return db;
    },
    lmdbSupport,
    relayMessages,
    cluster,
    opts.port || opts.web ? websocketTransport.server(opts) : R.identity,
    ...(opts.peers || []).map(peer => websocketTransport.client(peer))
  )(opts);

runServer({
  host: "0.0.0.0",
  port: process.env.PORT || 4444
});
