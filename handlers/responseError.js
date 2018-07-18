module.exports = function ResponseError(status, message) {
	console.log(`RESPONSE ERROR: ${status}`);
  	Error.captureStackTrace(this, this.constructor);
  	this.name = this.constructor.name;
  	this.status = status;
  	this.message = message;
};

require('util').inherits(module.exports, Error);
