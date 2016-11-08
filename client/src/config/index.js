const env = process.env.NODE_ENV || 'development';
const config = {
  development: require('./development.js'),
  test: require('./test.js'),
  production: require('./production.js'),
};
const exportedConfig = config[env].default;
export default exportedConfig;
