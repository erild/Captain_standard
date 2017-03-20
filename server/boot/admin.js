module.exports = function (app) {
  if (process.env.DB_AUTOUPDATE) {
    return;
  }
  app.models.Role.upsertWithWhere({name: 'admin'}, {
    name: 'admin'
  }, function(err, role) {
    if (err) throw err;
  });
};
