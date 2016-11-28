const linters = require('../linters.json');

module.exports = function (app) {
  linters.forEach(linter => {
    app.models.Linter.findOne({where: {name: linter.name}}, (err, res) => {
      if (!err && !res) {
        linter['addedOn'] = new Date();
        app.models.Linter.create(linter);
      }
    });
  });
};
