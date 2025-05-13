const { spawn } = require('child_process');
const path = require('path');
const treeKill = require('tree-kill');

let frontendProcess;
let backendProcess;

function startFrontend() {
  console.log('Starting frontend...');
  frontendProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });
}

function startBackend() {
  console.log('Starting backend...');
  backendProcess = spawn('node', ['backend/server.js'], {
    stdio: 'inherit',
    shell: true
  });
}

function cleanup() {
  if (frontendProcess) {
    treeKill(frontendProcess.pid);
  }
  if (backendProcess) {
    treeKill(backendProcess.pid);
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

startFrontend();
startBackend(); 