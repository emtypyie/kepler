// Parallax
const bg = document.getElementById('parallaxBg');
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (bg) bg.style.transform = `translateY(${scrollY * 0.3}px)`;
});

// Scroll-triggered animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Nav transparency on scroll
const nav = document.getElementById('landingNav');
window.addEventListener('scroll', () => {
  if (nav) {
    nav.style.background = window.scrollY > 60
      ? 'rgba(20,20,20,0.95)'
      : 'rgba(20,20,20,0.6)';
  }
});
