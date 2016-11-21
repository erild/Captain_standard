module.exports = function (Customer) {
  Customer.observe('before save', (context, callback) => {
    if (context.instance && context.instance.__data) {
      const regexResult = /^github\.(.*)/.exec(context.instance.__data.username);
      if (regexResult) {
        context.instance.__data.username = /^github\.(.*)/.exec(context.instance.__data.username)[1];
      }
    }
    callback();
  });
};
