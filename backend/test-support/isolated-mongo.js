'use strict';

const { spawn } = require('node:child_process');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const net = require('node:net');
const mongoose = require('mongoose');

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function waitFor(task, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try { return await task(); } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw lastError || new Error('MongoDB de ensayo no inició');
}

async function startIsolatedMongo() {
  const directory = await mkdtemp(path.join(tmpdir(), 'feka-security-test-'));
  const port = await freePort();
  const uri = `mongodb://127.0.0.1:${port}/feka_security_test?replicaSet=rs_feka_test`;
  const log = path.join(directory, 'mongod.log');
  const process = spawn('mongod', [
    '--dbpath', directory, '--port', String(port), '--bind_ip', '127.0.0.1',
    '--replSet', 'rs_feka_test', '--logpath', log, '--quiet'
  ], { stdio: 'ignore' });
  const directUri = `mongodb://127.0.0.1:${port}/admin?directConnection=true`;
  const client = new mongoose.mongo.MongoClient(directUri, { serverSelectionTimeoutMS: 500 });
  try {
    await waitFor(async () => { await client.connect(); await client.db('admin').command({ ping: 1 }); });
    await client.db('admin').command({ replSetInitiate: {
      _id: 'rs_feka_test', members: [{ _id: 0, host: `127.0.0.1:${port}` }]
    } });
    await waitFor(async () => {
      const result = await client.db('admin').command({ hello: 1 });
      if (!result.isWritablePrimary) throw new Error('Esperando réplica primaria');
    });
    await client.close();
    return {
      uri,
      async stop() {
        await mongoose.disconnect();
        process.kill('SIGTERM');
        await new Promise(resolve => { if (process.exitCode !== null) resolve(); else process.once('exit', resolve); });
        await rm(directory, { recursive: true, force: true });
      }
    };
  } catch (error) {
    await client.close().catch(() => {});
    process.kill('SIGTERM');
    const detail = await readFile(log, 'utf8').catch(() => '');
    await rm(directory, { recursive: true, force: true });
    throw new Error(`No se pudo iniciar MongoDB aislado: ${error.message}\n${detail.slice(-800)}`);
  }
}

module.exports = { startIsolatedMongo };
