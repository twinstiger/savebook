document.addEventListener('DOMContentLoaded', function() {
  var hamburger = document.querySelector('.hamburger');
  var navMobile = document.querySelector('.nav-mobile');
  var mobileDropdowns = document.querySelectorAll('.mobile-dropdown');

  if (hamburger && navMobile) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navMobile.classList.toggle('active');
      document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });
  }

  mobileDropdowns.forEach(function(dropdown) {
    var link = dropdown.querySelector('a');
    if (link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('active');
      });
    }
  });

  window.addEventListener('scroll', function() {
    var header = document.querySelector('.header');
    if (header) {
      header.style.boxShadow = window.scrollY > 50 ? '0 4px 20px rgba(0,0,0,0.7)' : '0 4px 20px rgba(0,0,0,0.5)';
    }
  });

  // ===== Stats counter animation =====
  var statNums = document.querySelectorAll('.stat-num');
  var counted = {};
  var observerOptions = { threshold: 0.5 };

  function animateCounter(el, target, suffix) {
    var duration = 1500;
    var start = 0;
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current + (suffix || '');
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + (suffix || '');
    }
    requestAnimationFrame(step);
  }

  var statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !counted[entry.target]) {
        counted[entry.target] = true;
        var el = entry.target;
        var text = el.textContent.trim();
        var num = parseInt(text.replace(/\D/g, '')) || 0;
        var suffix = text.replace(/[\d]/g, '');
        animateCounter(el, num, suffix);
      }
    });
  }, observerOptions);

  statNums.forEach(function(el) { statsObserver.observe(el); });

  // ===== Game card 3D mouse-follow tilt =====
  var tiltCards = document.querySelectorAll('.game-card');
  tiltCards.forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -8;
      var rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)';
    });
    card.addEventListener('mouseleave', function() {
      card.style.transform = '';
    });
  });

  // ===== Particles background =====
  (function() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var animId = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var colors = ['#e63946', '#ff2d78', '#00d4aa', '#8b5cf6', '#e63946', '#ff2d78'];
    var count = Math.min(40, Math.floor(window.innerWidth / 40));

    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulse += p.pulseSpeed;
        var currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

        if (p.y < -10) {
          p.y = window.innerHeight + 10;
          p.x = Math.random() * window.innerWidth;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();
  })();

  // ===== Unified carousel with fade+zoom transition =====
  (function() {
    var track = document.getElementById('carousel-track');
    var dotsContainer = document.getElementById('carousel-dots');
    var prevBtn = document.getElementById('carousel-prev');
    var nextBtn = document.getElementById('carousel-next');
    if (!track || !dotsContainer) return;

    var items = track.querySelectorAll('.carousel-item');
    var currentIndex = 0;
    var isAutoPlaying = false;
    var autoTimer = null;
    var isTransitioning = false;

    // Build dots
    items.forEach(function(_, i) {
      var dot = document.createElement('span');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.dataset.index = i;
      dot.addEventListener('click', function() { goTo(i); });
      dotsContainer.appendChild(dot);
    });
    var dots = dotsContainer.querySelectorAll('.carousel-dot');

    function updateDots() {
      dots.forEach(function(d, i) {
        var isActive = i === currentIndex;
        d.classList.toggle('active', isActive);
        d.style.width = isActive ? '24px' : '8px';
        d.style.borderRadius = isActive ? '4px' : '50%';
      });
    }

    function goTo(index) {
      if (isTransitioning || index === currentIndex) return;
      isTransitioning = true;

      var oldItem = items[currentIndex];
      currentIndex = index;
      var newItem = items[currentIndex];

      // Fade+zoom out old
      oldItem.classList.add('transitioning');

      setTimeout(function() {
        track.scrollTo({ left: items[currentIndex].offsetLeft - track.offsetLeft, behavior: 'smooth' });
        updateDots();

        // Add transition class to new item for fade+zoom in
        newItem.classList.add('transitioning');

        setTimeout(function() {
          oldItem.classList.remove('transitioning');
          newItem.classList.remove('transitioning');
          isTransitioning = false;
        }, 400);
      }, 200);

      resetAutoPlay();
    }

    function resetAutoPlay() {
      if (autoTimer) clearTimeout(autoTimer);
      if (isAutoPlaying) autoTimer = setTimeout(function() { next(); }, 4000);
    }

    function next() {
      goTo((currentIndex + 1) % items.length);
    }
    function prev() {
      goTo((currentIndex - 1 + items.length) % items.length);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    isAutoPlaying = true;
    resetAutoPlay();

    track.addEventListener('scroll', function() {
      var closestIndex = 0;
      var closestDist = Infinity;
      items.forEach(function(item, i) {
        var dist = Math.abs(item.offsetLeft - track.scrollLeft);
        if (dist < closestDist) { closestDist = dist; closestIndex = i; }
      });
      currentIndex = closestIndex;
      updateDots();
    });
  })();
});