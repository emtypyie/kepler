const bg = document.getElementById('parallaxBg');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (bg) bg.style.transform = `translateY(${scrollY * 0.08}px) scale(1.15)`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

const nav = document.getElementById('landingNav');
window.addEventListener('scroll', () => {
  if (nav) {
    nav.style.background = window.scrollY > 60
      ? 'rgba(20,20,20,0.95)'
      : 'rgba(20,20,20,0.6)';
  }
});

function positionToggle() {
  const sidebar = document.getElementById('guideSidebar');
  const btn = document.getElementById('guideToggle');
  if (!sidebar || !btn) return;
  if (sidebar.classList.contains('collapsed')) {
    btn.style.left = '-8px';
  } else {
    btn.style.left = (sidebar.offsetLeft + sidebar.offsetWidth - btn.offsetWidth) + 'px';
  }
}

function toggleGuide() {
  const sidebar = document.getElementById('guideSidebar');
  const btn = document.getElementById('guideToggle');
  sidebar.classList.toggle('collapsed');
  btn.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
  positionToggle();
}

window.addEventListener('resize', positionToggle);
positionToggle();
