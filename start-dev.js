const { spawn } = require('child_process');
const { exec } = require('child_process');
const path = require('path');

console.log('Starting development servers...');

// Kill any existing Node.js processes
exec('taskkill /F /IM node.exe', (error) => {
  if (error) {
    console.log('No existing Node.js processes found');
  } else {
    console.log('Killed existing Node.js processes');
  }

  // Start the development servers
  console.log('Starting backend server...');
  const backend = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    shell: true
  });

  console.log('Starting frontend server...');
  const frontend = spawn('npm', ['run', 'client'], { 
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down development servers...');
    backend.kill();
    frontend.kill();
    process.exit();
  });

  // Handle errors
  backend.on('error', (error) => {
    console.error('Backend error:', error);
  });

  frontend.on('error', (error) => {
    console.error('Frontend error:', error);
  });

  // Log when processes exit
  backend.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  frontend.on('exit', (code) => {
    console.log(`Frontend process exited with code ${code}`);
  });
}); 