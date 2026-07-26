const BACKEND = getBackendUrl();

async function loadSystemInfo() {
  try {
    const res = await fetch(`${BACKEND}/api/pyieos/info`, {
      headers: { 'Authorization': auth.getUser().token }
    });
    const info = await res.json();

    document.getElementById('cpuValue').textContent = info.cpu.model.split('@')[0].trim().substring(0, 30) + '…';
    document.getElementById('cpuDetail').textContent = `${info.cpu.cores} cores · ${info.cpu.load.toFixed(1)} load`;

    const usedGB = (info.memory.used / 1073741824).toFixed(1);
    const totalGB = (info.memory.total / 1073741824).toFixed(1);
    document.getElementById('memValue').textContent = `${info.memory.usagePercent}%`;
    document.getElementById('memDetail').textContent = `${usedGB} GB / ${totalGB} GB used`;

    const diskKeys = Object.keys(info.disk);
    if (diskKeys.length > 0) {
      const d = info.disk[diskKeys[0]];
      const usedDiskGB = (d.used / 1073741824).toFixed(1);
      const totalDiskGB = (d.total / 1073741824).toFixed(1);
      const diskPct = d.total > 0 ? Math.round((d.used / d.total) * 100) : 0;
      document.getElementById('diskValue').textContent = `${diskPct}%`;
      document.getElementById('diskDetail').textContent = `${usedDiskGB} GB / ${totalDiskGB} GB (${diskKeys[0]})`;
    }

    const days = Math.floor(info.uptime / 86400);
    const hours = Math.floor((info.uptime % 86400) / 3600);
    const mins = Math.floor((info.uptime % 3600) / 60);
    document.getElementById('uptimeValue').textContent = `${days}d ${hours}h ${mins}m`;
    document.getElementById('uptimeDetail').textContent = `${info.hostname} · ${info.platform}`;

    const table = document.getElementById('sysinfoTable');
    table.innerHTML = `
      <div class="sysinfo-row"><span>Hostname</span><span>${info.hostname}</span></div>
      <div class="sysinfo-row"><span>Platform</span><span>${info.platform} ${info.arch}</span></div>
      <div class="sysinfo-row"><span>Release</span><span>${info.release}</span></div>
      <div class="sysinfo-row"><span>CPU</span><span>${info.cpu.model}</span></div>
      <div class="sysinfo-row"><span>Cores</span><span>${info.cpu.cores}</span></div>
      <div class="sysinfo-row"><span>Memory</span><span>${totalGB} GB total</span></div>
      <div class="sysinfo-row"><span>Load</span><span>${info.cpu.load.toFixed(2)}</span></div>
    `;
  } catch (e) {
    document.getElementById('cpuValue').textContent = 'Offline';
  }
}

async function loadServices() {
  try {
    const res = await fetch(`${BACKEND}/api/pyieos/services`, {
      headers: { 'Authorization': auth.getUser().token }
    });
    const services = await res.json();
    const table = document.getElementById('servicesTable');
    table.innerHTML = services.map(s => `
      <div class="service-row">
        <span class="service-name">${s.name}</span>
        <span class="service-status status-${s.status}">${s.status}${s.version ? ' (' + s.version + ')' : ''}</span>
      </div>
    `).join('');
  } catch {}
}

function copyCmd(btn) {
  const code = btn.previousElementSibling;
  navigator.clipboard.writeText(code.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSystemInfo();
  loadServices();
  setInterval(loadSystemInfo, 5000);
});
