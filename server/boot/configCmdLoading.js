const configCmds = require('../configCmds.json');

module.exports = function (app) {
  if (process.env.DB_AUTOUPDATE) {
    return;
  }
  configCmds.forEach(configCmd => {
    app.models.ConfigCmd.upsertWithWhere({name: configCmd.name}, configCmd, err => {
      if (err) {
        console.error('Error updating ' + configCmd.name);
        console.dir(err);
      }
    });
  });
};
