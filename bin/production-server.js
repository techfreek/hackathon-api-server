#!/usr/bin/env node

/**
 * Referenced from
 * https://www.digitalocean.com/community/tutorials/how-to-write-a-linux-daemon-with-node-js-on-a-vps
 */

var cluster = require('cluster');
var daemon = require('daemon');
var fs = require('fs');

var log = require('../lib/logging.js');

var root = process.getgid() === 0;

if (cluster.isMaster) {
  daemon();

  log.info('Starting')
  createWorkers();
  if (root) {
    var pidLocation = '/var/run/hackathon-api-server.pid';
    fs.writeFile(pidLocation, process.pid, function(err) {
      if (err) {
        log.error(err);
      }
    });
  }

  process.on('SIGHUP', sighup);
  process.on('SIGTERM', sigterm);
} else {
  runWorker();
}


/**
 * Creates a new child worker if this is the master process, otherwise it
 * starts the api server.
 */
function createWorker() {
  // "fok a child" if running as cluster master
  var child = cluster.fork();

  // Respawn the child process after exit
  // This is for any potentially uncaught exceptions
  child.on('exit', function (code, singal) {
    createWorker();
  });
}


/**
 * Creates the specified number of workers.
 * @param n The number of workers to create.
 */
function createWorkers() {
  var n = require('os').cpus().length * 2;
  while (n-- > 0) {
    createWorker();
  }
}


/**
 * Kills all the child workers with the given signal
 * @param signal The signal number to send to process.kill
 */
function killAllWorkers(signal) {
  var uniqueId, worker;

  for (uniqueId in cluster.workers) {
    if (cluster.workers.hasOwnProperty(uniqueId)) {
      worker = cluster.workers[uniqueId];
      worker.removeAllListeners();
      worker.process.kill(signal);
    }
  }
}


function runWorker() {
  // Run the HTTP server if running as a worker
  var apiServer = require('../lib/api-server.js');
  var config = require('../conf/config.json');
  var server = apiServer.startServer(config);

  // Listen for terminate signals
  process.on('SIGTERM', function() {
    server.close(function() {
      // Disconnect from cluster master
      process.disconnect && process.disconnect();
    })
  });

  // Check if root. If so drop the permissions down.
  if (root) {
    process.setgid('hackathon-api-server');
    process.setuid('hackathon-api-server');
  }
}


/**
 * Restart the child processes
 */
function sighup() {
  log.info('SIGHUP received...restarting workers');
  killAllWorkers('SIGTERM');
  createWorkers();
}


/**
 * Nicely terminate the child processes
 */
function sigterm() {
  log.info('SIGTERM received...shutting down');
  killAllWorkers('SIGTERM');

  if (root) {
    fs.unlink(pidLocation, function(err) {
      if (err) {
        log.error(err);
      }
    });
  }
}