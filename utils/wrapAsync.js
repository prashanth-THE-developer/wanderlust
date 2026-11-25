// Wraps an async route so any error goes to our error handler
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
