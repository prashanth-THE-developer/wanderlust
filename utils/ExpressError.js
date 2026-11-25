class ExpressError extends Error {
  constructor(statusCode, message) {
    super(message);          // sets error.message properly
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;
