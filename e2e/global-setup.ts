import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

async function waitUntilReady(child: ChildProcess) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`El servidor E2E terminó con código ${child.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:3010/api/health');
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('El servidor E2E no estuvo listo en 30 segundos');
}

export default async function globalSetup() {
  const child = spawn(process.execPath, [path.resolve('scripts/e2e-server.mjs')], {
    cwd: process.cwd(),
    stdio: 'inherit',
    windowsHide: true,
  });
  await waitUntilReady(child);

  return async () => {
    if (child.exitCode == null) child.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      if (child.exitCode != null) return resolve();
      child.once('exit', () => resolve());
      setTimeout(() => {
        if (child.exitCode == null) child.kill('SIGKILL');
        resolve();
      }, 2_000);
    });
  };
}
