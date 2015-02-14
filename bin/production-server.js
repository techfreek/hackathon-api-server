#!/usr/bin/env node

/**
 * Referenced from
 * https://www.digitalocean.com/community/tutorials/how-to-write-a-linux-daemon-with-node-js-on-a-vps
 */

require('daemon')();

var cluster = require('cluster');

var numCpus = require('os').cpus().length;

/**
 * Creates a new child worker if this is the master process, otherwise it
 * starts the api server.
 */
function createWorker() {
  if (cluster.isMaster) {
    // "fok a child" if running as cluster master
    var child = cluster.fork();

    // Respawn the child process after exit
    // This is for any potentially uncaught exceptions
    child.on('exit', function (code, singal) {
      createWorker();
    });
  } else {
    // Run the HTTP server if running as a worker
    var apiServer = require(__dirname + '/hackathon-api-server.js');
    var config = require(__dirname + '/../conf/config.json');
    var server = apiServer.startServer(config);

    // Listen for terminate signals
    process.on('SIGTERM', function() {
      server.close(function() {
        // Disconnect from cluster master
        process.disconnect && process.disconnect();
      })
    });

    // Check if root. If so drop the permissions down.
    if (process.getgid() === 0) {
      process.setgid('hackathon-api-server');
      process.setuid('hackathon-api-server');
    }
  }
}

/**
 * Creates the specified number of workers.
 * @param n The number of workers to create.
 */
function createWorkers(n) {
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

/**
 * Restart the child processes
 */
process.on('SIGHUP', function() {
  killAllWorkers('SIGTERM');
  createWorkers(numCpus * 2);
});

/**
 * Nicely terminate the child processes
 */
process.on('SIGTERM', function() {
  killAllWorkers('SIGTERM');
});

createWorkers(numCpus * 2);