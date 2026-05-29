/* ============================================
   Savebook Shared - JavaScript
   Mobile menu, scroll effects, dropdowns
   ============================================ */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initScrollHeader();
    initDropdowns();
    initSmoothScroll();
  });

  /* ----------
     Mobile Menu Toggle
     ---------- */
  function initMobileMenu() {
    var hamburger = document.querySelector('.hamburger');
    var navMobile = document.querySelector('.nav-mobile');
    var mobileDropdowns = document.querySelectorAll('.mobile-dropdown');

    if (!hamburger || !navMobile) return;

    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navMobile.classList.toggle('active');
      document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!navMobile.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        navMobile.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Mobile dropdowns
    mobileDropdowns.forEach(function(dropdown) {
      var link = dropdown.querySelector('a');
      if (link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        });
      }
    });
  }

  /* ----------
     Scroll Header Shadow
     ---------- */
  function initScrollHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var lastScrollY = 0;
    var ticking = false;

    function updateHeader() {
      var scrollY = window.scrollY;
      if (scrollY > 50) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      } else {
        header.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ----------
     Desktop Dropdowns
     ---------- */
  function initDropdowns() {
    var dropdowns = document.querySelectorAll('.nav-desktop .dropdown');
    dropdowns.forEach(function(dropdown) {
      var parent = dropdown.closest('li');
      if (!parent) return;

      // Show on hover (desktop only)
      if (window.matchMedia('(min-width: 768px)').matches) {
        parent.addEventListener('mouseenter', function() {
          dropdown.classList.add('visible');
        });
        parent.addEventListener('mouseleave', function() {
          dropdown.classList.remove('visible');
        });
      }
    });
  }

  /* ----------
     Smooth Scroll for Anchor Links
     ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

})();