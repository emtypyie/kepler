const os = require('os');
const { execSync } = require('child_process');
const { requireAuth } = require('../../core/auth');
const fs = require('fs');
const path = require('path');

const STARTUP_DIR = path.join(__dirname, '..', '..', 'autostart');

function getSystemInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  let diskInfo = {};
  try {
    if (process.platform === 'win32') {
      const out = execSync('wmic logicaldisk get size,freespace,caption /format:csv', { encoding: 'utf8', timeout: 3000 });
      const lines = out.trim().split('\n').slice(1);
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const drive = parts[1]?.trim();
          const free = parseInt(parts[2]) || 0;
          const total = parseInt(parts[3]) || 0;
          if (drive) diskInfo[drive] = { total, free, used: total - free };
        }
      }
    } else {
      const out = execSync('df -B1 /', { encoding: 'utf8', timeout: 3000 });
      const lines = out.trim().split('\n');
      if (lines.length >= 2) {
        const parts = lines[1].split(/\s+/);
        if (parts.length >= 4) {
          diskInfo['/'] = { total: parseInt(parts[1]) || 0, used: parseInt(parts[2]) || 0, free: parseInt(parts[3]) || 0 };
        }
      }
    }
  } catch {}

  let hostname = os.hostname();
  let platform = process.platform;
  let arch = os.arch();
  let release = os.release();
  let uptime = os.uptime();

  return {
    hostname,
    platform,
    arch,
    release,
    uptime,
    cpu: {
      model: cpus.length > 0 ? cpus[0].model : 'Unknown',
      cores: cpus.length,
      load: loadAvg[0] || 0,
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      usagePercent: totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0,
    },
    disk: diskInfo,
  };
}

function getServiceStatus() {
  const services = [];

  try {
    if (process.platform === 'win32') {
      if (fs.existsSync(path.join(STARTUP_DIR, 'kepler.bat'))) {
        services.push({ name: 'kepler-backend', status: 'configured', type: 'windows-startup' });
      }
    } else if (process.platform === 'linux') {
      const out = execSync('systemctl is-active kepler 2>/dev/null || echo inactive', { encoding: 'utf8', timeout: 3000 });
      services.push({ name: 'kepler', status: out.trim(), type: 'systemd' });
    } else if (process.platform === 'darwin') {
      const out = execSync('launchctl list 2>/dev/null | grep kepler || echo not-loaded', { encoding: 'utf8', timeout: 3000 });
      services.push({ name: 'kepler', status: out.trim() ? 'loaded' : 'not-loaded', type: 'launchd' });
    }
  } catch {}

  try {
    const proc = execSync('node -v', { encoding: 'utf8', timeout: 2000 });
    services.push({ name: 'node-runtime', status: 'running', version: proc.trim() });
  } catch {
    services.push({ name: 'node-runtime', status: 'unavailable' });
  }

  return services;
}

function register(app) {
  app.get('/api/pyieos/info', requireAuth, (req, res) => {
    res.json(getSystemInfo());
  });

  app.get('/api/pyieos/services', requireAuth, (req, res) => {
    res.json(getServiceStatus());
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0', port: 41783, services: ['ediary', 'pyieos'] });
  });
}

module.exports = { register, name: 'pyieos' };
