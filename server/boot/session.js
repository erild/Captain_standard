module.exports = function (app, cb) {
  const pg = require('pg');
  const session = require('express-session');
  const pgSession = require('connect-pg-simple')(session);
  const conString = {
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
    host: process.env.DATABASE_HOST,
    password: process.env.DATABASE_PASSWORD,
  };
  const client = new pg.Client(conString);
  const endCallback = function (err) {
    if (err) {
      throw err;
    }
    client.end(err => {
      if (err) {
        throw err;
      }
    });
    cb();
  };

  client.connect(err => {
    if (err) {
      throw err;
    }
    client.query(`
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
);
SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey';`, (err, res) => {
      if (err) {
        throw err;
      }

      if (res.rowCount === 0) {
        client.query(`
ALTER TABLE "session"
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
NOT DEFERRABLE INITIALLY IMMEDIATE`,
          endCallback);
      } else {
        console.log('Table session already exists');
        endCallback();
      }
    });
  });

  app.middleware('session', session({
    'store': new pgSession({
      pg: pg,
      conString: conString,
      secret: process.env.SESSION_SECRET,
      pruneSessionInterval: process.env.DB_AUTOUPDATE ? false : 60,
    }),
    'saveUninitialized': true,
    'resave': true,
    'secret': process.env.SESSION_SECRET,
  }));
};
