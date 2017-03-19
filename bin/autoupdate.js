'use strict';
const path = require('path');
process.env.DB_AUTOUPDATE = true;
const app = require(path.resolve(__dirname, '../server/server'));
const ds = app.datasources.db;
const tables = [
  'Customer', 'User', 'AccessToken', 'ACL', 'RoleMapping', 'Role',
  'UserCredential', 'UserIdentity', 'Linter', 'PersistedModel', 'Project',
  'ProjectLinter', 'ProjectCustomer', 'ProjectInstallation',
  'Script', 'ProjectScript', 'ProjectConfigCmd', 'ConfigCmd',
];
ds.autoupdate(tables, err => {
  if (err) {
    throw err;
  }
  ds.disconnect();
});
