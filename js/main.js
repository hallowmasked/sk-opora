/**
 * Main JavaScript for Construction Company Website
 * Handles: phone mask, form validation, scroll effects, portfolio filter, modals
 */

(() => {
  'use strict';

  // ========================================
  // DOM Elements
  // ========================================
  const phoneInputs = document.querySelectorAll('.js-phone');
  const forms = document.querySelectorAll('.js-form');
  const header = document.querySelector('.header');
  const toastEl = document.getElementById('formSuccessToast');
  const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 4000 }) : null;
  const serviceModal = document.getElementById('serviceModal');
  const siteConfig = window.siteConfig || {};
  const FORM_ENDPOINT = siteConfig.forms?.endpoint || null;

  // ========================================
  // Phone Mask
  // ========================================
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
    const normalized = digits.startsWith('7') ? digits : `7${digits}`;

    let result = '+7';
    if (normalized.length > 1) result += ` (${normalized.slice(1, 4)}`;
    if (normalized.length >= 5) result += `) ${normalized.slice(4, 7)}`;
    if (normalized.length >= 8) result += `-${normalized.slice(7, 9)}`;
    if (normalized.length >= 10) result += `-${normalized.slice(9, 11)}`;

    return result;
  };

  phoneInputs.forEach((input) => {
    input.addEventListener('input', () => {
      input.value = formatPhone(input.value);
    });

    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+7 ';
    });

    input.addEventListener('blur', () => {
      if (input.value === '+7 ' || input.value === '+7') {
        input.value = '';
      }
    });
  });

  // ========================================
  // Error Toast
  // ========================================
  const errorToastEl = document.getElementById('formErrorToast');
  const errorToast = errorToastEl ? new bootstrap.Toast(errorToastEl, { delay: 5000 }) : null;

  const showError = (message) => {
    if (errorToast) {
      const body = errorToastEl.querySelector('.toast-body');
      if (body) body.textContent = message;
      errorToast.show();
    } else {
      alert(message);
    }
  };

  const ensureHiddenInput = (form, name, value = '') => {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.prepend(input);
    }
    input.value = value;
    return input;
  };

  const detectFormSource = (form) => {
    if (form.dataset.formSource) return form.dataset.formSource;
    if (form.closest('#callbackModal')) return 'callback-modal';
    if (form.closest('#serviceModal')) return 'service-modal';
    if (form.closest('#order')) return 'project-detail';
    if (form.closest('#callback')) return 'hero-consultation';
    if (form.closest('#contacts')) return 'contacts-callback';
    if (form.closest('.build-section')) return 'build-request';
    if (form.closest('.section--cta')) return 'cta-quick-request';
    return `${window.location.pathname.replace(/\//g, '') || 'index'}-form`;
  };

  const prepareFormMetadata = (form) => {
    ensureHiddenInput(form, 'source', detectFormSource(form));

    if (form.closest('#order')) {
      const params = new URLSearchParams(window.location.search);
      ensureHiddenInput(form, 'project_id', params.get('id') || '');
      const projectTitle = document.querySelector('.project-detail__title')?.textContent?.trim() || '';
      ensureHiddenInput(form, 'project_name', projectTitle);
    }
  };

  // ========================================
  // Form Validation & Submission
  // ========================================
  const validateForm = (form) => {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach((input) => {
      // Remove previous invalid state
      input.classList.remove('is-invalid');

      if (input.type === 'checkbox') {
        if (!input.checked) {
          isValid = false;
          input.classList.add('is-invalid');
        }
      } else if (input.type === 'tel') {
        const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(input.value)) {
          isValid = false;
          input.classList.add('is-invalid');
        }
      } else {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add('is-invalid');
        }
      }
    });

    return isValid;
  };

  const submitForm = async (form) => {
    prepareFormMetadata(form);

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!FORM_ENDPOINT) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { success: true, mode: 'demo', payload };
    }

    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Произошла ошибка отправки. Попробуйте позже.');
    }

    return response.json().catch(() => ({ success: true }));
  };

  forms.forEach((form) => {
    prepareFormMetadata(form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!validateForm(form)) {
        // Focus first invalid field
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Отправка...';

      try {
        await submitForm(form);

        // Reset form and show success
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (toast) {
          toast.show();
        }

        // Close modal if form is inside one
        const modal = form.closest('.modal');
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        // Show error message
        const errorMessage = error.message || 'Произошла ошибка. Попробуйте позже или позвоните нам.';
        showError(errorMessage);
      }
    });

    // Real-time validation on blur
    form.querySelectorAll('input, textarea, select').forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.hasAttribute('required')) {
          if (input.type === 'checkbox') {
            input.classList.toggle('is-invalid', !input.checked);
          } else if (input.type === 'tel') {
            const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
            input.classList.toggle('is-invalid', !phoneRegex.test(input.value) && input.value !== '');
          } else {
            input.classList.toggle('is-invalid', !input.value.trim());
          }
        }
      });

      // Remove invalid state on input
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
      });
    });
  });

  // ========================================
  // Scroll Effects
  // ========================================
  let lastScrollY = 0;
  let ticking = false;
  let headerOffsetTop = 0;
  const heroHeight = 600; // Примерная высота hero секции

  // Запоминаем начальную позицию шапки
  if (header) {
    headerOffsetTop = header.offsetTop;
  }

  const handleScroll = () => {
    const scrollY = window.scrollY;

    // Header: прозрачный с размытием по умолчанию, залитый при скролле past hero
    if (header) {
      if (scrollY > heroHeight - 100) {
        // Navbar становится залитым (без размытия)
        header.classList.add('header--opaque');
      } else {
        // Прозрачный с размытием
        header.classList.remove('header--opaque');
      }
    }

    lastScrollY = scrollY;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  // ========================================
  // Smooth Scroll for Anchor Links
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        event.preventDefault();

        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        const navCollapse = document.getElementById('mainNav');
        if (navCollapse && navCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      }
    });
  });

  // ========================================
  // Active Section Indicator
  // ========================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header-menu .nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const headerHeight = header ? header.offsetHeight : 0;
    const scrollPosition = window.scrollY + headerHeight + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // ========================================
  // Portfolio Filter
  // ========================================
  const filterGroups = document.querySelectorAll('[role="group"]');
  const filterHideTimers = new WeakMap();

  const clearFilterHideTimer = (item) => {
    const timerId = filterHideTimers.get(item);
    if (typeof timerId === 'number') {
      clearTimeout(timerId);
      filterHideTimers.delete(item);
    }
  };

  const animateFilterItem = (item, shouldShow) => {
    clearFilterHideTimer(item);
    item.classList.add('filter-anim-item');

    if (shouldShow) {
      item.style.display = '';
      item.removeAttribute('aria-hidden');
      void item.offsetWidth;
      item.classList.remove('is-filter-hidden');
      return;
    }

    item.classList.add('is-filter-hidden');
    item.setAttribute('aria-hidden', 'true');

    const timerId = window.setTimeout(() => {
      item.style.display = 'none';
    }, 220);

    filterHideTimers.set(item, timerId);
  };

  filterGroups.forEach((group) => {
    const groupFilters = group.querySelectorAll('.js-filter');
    if (!groupFilters.length) return;

    const scopeRoot = group.closest('main') || document;
    const projectsItems = scopeRoot.querySelectorAll('.projects-grid [data-type]');
    const portfolioItems = scopeRoot.querySelectorAll('#portfolioGrid .portfolio-item');
    const items = projectsItems.length ? projectsItems : portfolioItems;

    if (!items.length) return;

    items.forEach((item) => {
      item.classList.add('filter-anim-item');
      item.classList.remove('is-filter-hidden');
      item.style.display = '';
      item.removeAttribute('aria-hidden');
    });

    groupFilters.forEach((filterBtn) => {
      filterBtn.addEventListener('click', () => {
        groupFilters.forEach((btn) => {
          btn.classList.remove('active', 'btn-primary');
          btn.classList.add('btn-outline-primary');
        });

        filterBtn.classList.remove('btn-outline-primary');
        filterBtn.classList.add('active', 'btn-primary');

        const value = filterBtn.dataset.filter;
        items.forEach((item) => {
          const shouldShow = value === 'all' || item.dataset.type === value;
          animateFilterItem(item, shouldShow);
        });
      });
    });
  });

  // ========================================
  // Portfolio Modal
  // ========================================
  const portfolioModal = document.getElementById('portfolioModal');
  if (portfolioModal) {
    portfolioModal.addEventListener('show.bs.modal', (event) => {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const title = trigger.dataset.title || 'Проект';
      const area = trigger.dataset.area || '-';
      const year = trigger.dataset.year || '-';
      const type = trigger.dataset.typeFull || '-';
      const image = trigger.dataset.image || '';

      document.getElementById('portfolioModalTitle').textContent = title;
      document.getElementById('portfolioModalTitle2').textContent = title;
      document.getElementById('portfolioModalArea').textContent = area;
      document.getElementById('portfolioModalYear').textContent = year;
      document.getElementById('portfolioModalType').textContent = type;

      const imageEl = document.getElementById('portfolioModalImage');
      if (imageEl) {
        if (image) {
          imageEl.src = image;
          imageEl.alt = title;
        } else {
          imageEl.src = '';
          imageEl.alt = 'Фото проекта';
        }
      }
    });
  }

  // ========================================
  // Intersection Observer for Animations
  // ========================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        animateOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements
  document.querySelectorAll('.service-card, .adv-card, .review-card, .step-card, .project-card, .type-card').forEach((el) => {
    el.style.opacity = '0';
    animateOnScroll.observe(el);
  });

  // ========================================
  // Lazy Load Images (placeholder for future)
  // ========================================
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // ========================================
  // Mobile Menu - Close on outside click
  // ========================================
  const navbarCollapse = document.getElementById('mainNav');
  const navbarToggler = document.querySelector('.navbar-toggler');

  if (navbarCollapse && navbarToggler) {
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isNavbarOpen = navbarCollapse.classList.contains('show');
      const isClickInsideNavbar = navbarCollapse.contains(event.target);
      const isClickOnToggler = navbarToggler.contains(event.target);

      if (isNavbarOpen && !isClickInsideNavbar && !isClickOnToggler) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });

    // Close menu when clicking on a nav link
    navbarCollapse.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (navbarCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });
  }

  // ========================================
  // Keyboard Navigation
  // ========================================
  document.addEventListener('keydown', (event) => {
    // ESC key closes modals and mobile menu
    if (event.key === 'Escape') {
      // Close mobile menu
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }

      // Close modals
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        const bsModal = bootstrap.Modal.getInstance(openModal);
        if (bsModal) bsModal.hide();
      }

      // Close floating contacts popup
      closeAllFloatingPopups();
    }
  });

  // ========================================
  // Floating Contacts Button
  // ========================================
  const closeAllFloatingPopups = () => {
    document.querySelectorAll('.contact-floating').forEach((widget) => {
      const floatingMainBtn = widget.querySelector('.contact-floating-main');
      const floatingPopup = widget.querySelector('.contact-floating-popup');
      if (!floatingMainBtn || !floatingPopup) return;

      floatingPopup.classList.remove('is-visible');
      floatingMainBtn.setAttribute('aria-expanded', 'false');
    });
  };

  const initFloatingContacts = () => {
    const floatingWidgets = document.querySelectorAll('.contact-floating');
    if (!floatingWidgets.length) return;

    floatingWidgets.forEach((widget) => {
      if (widget.dataset.floatingInit === 'true') return;
      widget.dataset.floatingInit = 'true';

      const floatingMainBtn = widget.querySelector('.contact-floating-main');
      const floatingPopup = widget.querySelector('.contact-floating-popup');
      if (!floatingMainBtn || !floatingPopup) return;

      floatingMainBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isVisible = floatingPopup.classList.toggle('is-visible');
        floatingMainBtn.setAttribute('aria-expanded', String(isVisible));
      });

      document.addEventListener('click', (event) => {
        if (!widget.contains(event.target)) {
          floatingPopup.classList.remove('is-visible');
          floatingMainBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingContacts, { once: true });
  } else {
    initFloatingContacts();
  }

  // ========================================
  // Cookie Banner
  // ========================================
  if (!document.getElementById('cookieBanner')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cookie-banner" id="cookieBanner" role="alert" aria-live="polite">
        <div class="cookie-banner__content">
          <p class="cookie-banner__text">
            Мы используем cookie для улучшения работы сайта.
            <a href="privacy.html#cookies">Подробнее</a>
          </p>
          <div class="cookie-banner__actions">
            <button class="btn btn-sm btn-primary" id="cookieAccept">Принять</button>
            <button class="btn btn-sm btn-outline-light" id="cookieReject">Только необходимые</button>
            <button class="btn btn-sm btn-outline-secondary" id="cookieSettings">Настроить</button>
          </div>
        </div>
      </div>
    `);
  }

  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAcceptBtn = document.getElementById('cookieAccept');
  const cookieSettingsBtn = document.getElementById('cookieSettings');

  const COOKIE_CONSENT_KEY = 'cookie_consent';
  const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

  const setBrowserCookie = (name, value, maxAge = COOKIE_CONSENT_MAX_AGE) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  const removeBrowserCookie = (name) => {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  };

  const persistCookieConsent = (settings) => {
    localStorage.setItem('cookieSettings', JSON.stringify(settings));
    localStorage.setItem('cookiesAccepted', 'true');
    setBrowserCookie(COOKIE_CONSENT_KEY, JSON.stringify(settings));
  };

  const getStoredCookieSettings = () => {
    const raw = localStorage.getItem('cookieSettings');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem('cookieSettings');
      removeBrowserCookie(COOKIE_CONSENT_KEY);
      return null;
    }
  };

  const hideCookieBanner = () => {
    if (!cookieBanner) return;
    cookieBanner.style.opacity = '0';
    cookieBanner.style.transform = 'translateY(20px)';
    setTimeout(() => {
      cookieBanner.style.display = 'none';
    }, 300);
  };

  const applyCookieSettings = (settings) => {
    document.documentElement.dataset.cookieConsent = 'granted';
    document.documentElement.dataset.cookieFunctional = settings.functional ? 'granted' : 'denied';
    document.documentElement.dataset.cookieAnalytics = settings.analytics ? 'granted' : 'denied';
    document.documentElement.dataset.cookieMarketing = settings.marketing ? 'granted' : 'denied';

    if (!settings.functional) {
      removeBrowserCookie('site_preferences');
    } else {
      setBrowserCookie('site_preferences', 'enabled');
    }

    if (!settings.analytics) {
      removeBrowserCookie('site_analytics');
    } else {
      setBrowserCookie('site_analytics', 'enabled');
    }

    if (!settings.marketing) {
      removeBrowserCookie('site_marketing');
    } else {
      setBrowserCookie('site_marketing', 'enabled');
    }
  };

  const cookiesAccepted = localStorage.getItem('cookiesAccepted');
  const currentCookieSettings = getStoredCookieSettings();

  if (currentCookieSettings) {
    applyCookieSettings(currentCookieSettings);
  }

  if (cookiesAccepted === 'true' && cookieBanner) {
    cookieBanner.style.display = 'none';
  }

  if (cookieAcceptBtn) {
    cookieAcceptBtn.addEventListener('click', () => {
      const acceptAllSettings = {
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true
      };
      persistCookieConsent(acceptAllSettings);
      applyCookieSettings(acceptAllSettings);
      initYandexMetrika();
      hideCookieBanner();
    });
  }

  const cookieRejectBtn = document.getElementById('cookieReject');
  if (cookieRejectBtn) {
    cookieRejectBtn.addEventListener('click', () => {
      const necessaryOnlySettings = {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false
      };
      persistCookieConsent(necessaryOnlySettings);
      applyCookieSettings(necessaryOnlySettings);
      hideCookieBanner();
    });
  }

  if (cookieSettingsBtn) {
    cookieSettingsBtn.addEventListener('click', () => {
      // Open cookie settings modal
      const modal = document.getElementById('cookieSettingsModal');
      if (modal && bootstrap.Modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      }
    });
  }

  const savedCookieSettings = localStorage.getItem('cookieSettings');
  if (savedCookieSettings) {
    try {
      const settings = JSON.parse(savedCookieSettings);
      const functional = document.getElementById('cookieFunctional');
      const analytics = document.getElementById('cookieAnalytics');
      const marketing = document.getElementById('cookieMarketing');

      if (functional) functional.checked = Boolean(settings.functional);
      if (analytics) analytics.checked = Boolean(settings.analytics);
      if (marketing) marketing.checked = Boolean(settings.marketing);
    } catch (error) {
      localStorage.removeItem('cookieSettings');
      removeBrowserCookie(COOKIE_CONSENT_KEY);
    }
  }

  // Save cookie settings
  const cookieSaveSettingsBtn = document.getElementById('cookieSaveSettings');
  if (cookieSaveSettingsBtn) {
    cookieSaveSettingsBtn.addEventListener('click', () => {
      const settings = {
        necessary: true, // Always enabled
        functional: document.getElementById('cookieFunctional')?.checked || false,
        analytics: document.getElementById('cookieAnalytics')?.checked || false,
        marketing: document.getElementById('cookieMarketing')?.checked || false
      };
      persistCookieConsent(settings);
      applyCookieSettings(settings);
      if (settings.analytics) {
        initYandexMetrika();
      }
      
      // Close modal
      const modal = document.getElementById('cookieSettingsModal');
      if (modal && bootstrap.Modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      
      // Hide banner
      hideCookieBanner();
    });
  }

  const initYandexMetrika = () => {
    const metrikaId = siteConfig.analytics?.yandexMetrikaId;
    if (!metrikaId || document.getElementById('yandex-metrika-script')) return;

    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();

    const script = document.createElement('script');
    script.id = 'yandex-metrika-script';
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);

    window.ym(metrikaId, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false
    });
  };

  if (serviceModal) {
    serviceModal.addEventListener('show.bs.modal', (event) => {
      const trigger = event.relatedTarget;
      const serviceTitle = trigger?.closest('.card-service')?.querySelector('.card-service-title')?.textContent?.trim() || '';
      const form = serviceModal.querySelector('.js-form');
      if (!form) return;

      ensureHiddenInput(form, 'service_name', serviceTitle);
    });
  }

  if (currentCookieSettings?.analytics === true) {
    initYandexMetrika();
  }

  // ========================================
  // Init complete
  // ========================================

})();
