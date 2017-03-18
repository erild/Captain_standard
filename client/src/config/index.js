const env = process.env.NODE_ENV || 'development';
const config = {
  development: require('./development.js'),
  test: require('./test.js'),
  production: require('./production.js'),
  default: require('./default.js'),
};
const exportedConfig = Object.assign(config.default.default, config[env].default);
export default exportedConfig;
