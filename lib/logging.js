#!/usr/bin/env node

var bunyan = require('bunyan');

var devLogger = bunyan.createLogger({
  name: "api-server"
});

var productionLogger = bunyan.createLogger({
  name: "production-server",
  streams: [{
    path: __dirname + '/../logfile'
  }]
});

var logger;
if (process.getgid() === 0) {
  logger = productionLogger;
} else {
  logger = devLogger;
}

module.exports = logger;

/**
 * From https://github.com/trentm/node-bunyan/issues/37
 * This catches uncaught exceptions, logs it, and closes the file streams
 * so we can actually see the log messages.
 */
process.on('uncaughtException', function (err) {
    // prevent infinite recursion
    process.removeListener('uncaughtException', arguments.callee);

    // bonus: log the exception
    logger.fatal(err);

    if (typeof(logger.streams[0]) !== 'object') return;

    process.exit(1);
});