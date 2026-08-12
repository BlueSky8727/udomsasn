import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100';
const backendURL = process.env.E2E_BACKEND_URL ?? 'http://localhost:4100/api';
const services = [];

function startService(name, args, cwd, env) {
  const output = [];
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const capture = (chunk) => {
    output.push(chunk.toString());
    if (output.length > 40) output.shift();
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  const service = { name, child, output };
  services.push(service);
  return service;
}

async function waitForService(service, url) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (service.child.exitCode !== null) {
      throw new Error(`${service.name} stopped before becoming ready:\n${service.output.join('')}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The service is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`${service.name} did not become ready at ${url}:\n${service.output.join('')}`);
}

async function stopService(service) {
  if (service.child.exitCode !== null) return;
  const exited = new Promise((resolveExit) => service.child.once('exit', resolveExit));
  service.child.kill();
  await Promise.race([exited, new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000))]);
  if (service.child.exitCode === null) service.child.kill('SIGKILL');
}

let exitCode = 1;
try {
  const backend = startService(
    'Backend',
    ['dist/main.js'],
    resolve(root, 'backend'),
    { PORT: '4100', CORS_ORIGIN: baseURL, SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '' },
  );
  const frontend = startService(
    'Frontend',
    ['node_modules/next/dist/bin/next', 'start'],
    root,
    { PORT: '3100', BACKEND_URL: backendURL },
  );

  await Promise.all([
    waitForService(backend, `${backendURL}/health/ready`),
    waitForService(frontend, `${baseURL}/login`),
  ]);

  exitCode = await new Promise((resolveExit, reject) => {
    const runner = spawn(
      process.execPath,
      ['node_modules/@playwright/test/cli.js', 'test'],
      {
        cwd: root,
        env: { ...process.env, E2E_BASE_URL: baseURL, E2E_BACKEND_URL: backendURL },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    runner.once('error', reject);
    runner.once('exit', (code) => resolveExit(code ?? 1));
  });
} finally {
  await Promise.all(services.reverse().map(stopService));
}

process.exitCode = exitCode;
