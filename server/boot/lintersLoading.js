const linters = require('../linters.json');

module.exports = function (app) {
  linters.forEach(linter => {
    app.models.Linter.upsertWithWhere({name: linter.name}, linter, err => {
      if (err) {
        console.error('Error updating ' + linter.name);
        console.dir(err);
      }
    });
  });
};
