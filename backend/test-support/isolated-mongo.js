'use strict';

const { existsSync } = require('node:fs');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server-core');

async function startIsolatedMongo() {
  const binary = {
    version: '8.0.38',
    ...(existsSync('/usr/bin/mongod') ? { systemBinary: '/usr/bin/mongod' } : {})
  };
  const replica = await MongoMemoryReplSet.create({
    binary,
    replSet: { count: 1, storageEngine: 'wiredTiger' }
  });
  return {
    uri: replica.getUri('feka_security_test'),
    async stop() {
      await mongoose.disconnect();
      await replica.stop({ doCleanup: true, force: true });
    }
  };
}

module.exports = { startIsolatedMongo };
