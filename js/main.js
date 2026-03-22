

(() => {
  'use strict';

  
  const phoneInputs = document.querySelectorAll('.js-phone');
  const forms = document.querySelectorAll('.js-form');
  const header = document.querySelector('.header');
  const navbarCollapse = document.getElementById('mainNav');
  const navbarToggler = document.querySelector('.navbar-toggler');
  const toastEl = document.getElementById('formSuccessToast');
  const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 4000 }) : null;
  const serviceModal = document.getElementById('serviceModal');
  const siteConfig = window.siteConfig || {};
  const FORM_ENDPOINT = siteConfig.forms?.endpoint || null;

  const updateHeaderHeightVar = () => {
    if (!header) return;
    const navbar = header.querySelector('.navbar');
    const baseMeasure = navbar ? navbar.getBoundingClientRect().height : header.getBoundingClientRect().height;
    const baseHeight = Math.max(64, Math.ceil(baseMeasure));
    document.documentElement.style.setProperty('--header-height', `${baseHeight}px`);
  };

  updateHeaderHeightVar();
  setTimeout(updateHeaderHeightVar, 80);
  setTimeout(updateHeaderHeightVar, 260);
  window.addEventListener('resize', updateHeaderHeightVar, { passive: true });
  window.addEventListener('orientationchange', updateHeaderHeightVar);
  window.addEventListener('load', updateHeaderHeightVar);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateHeaderHeightVar).catch(() => {});
  }

  if (navbarCollapse) {
    navbarCollapse.addEventListener('shown.bs.collapse', updateHeaderHeightVar);
    navbarCollapse.addEventListener('hidden.bs.collapse', updateHeaderHeightVar);
  }

  
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

  
  const validateForm = (form) => {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach((input) => {
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
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Отправка...';

      try {
        await submitForm(form);
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (toast) {
          toast.show();
        }
        const modal = form.closest('.modal');
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        const errorMessage = error.message || 'Произошла ошибка. Попробуйте позже или позвоните нам.';
        showError(errorMessage);
      }
    });
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
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
      });
    });
  });

  const addMoreReviews = () => {
    const reviewsList = document.querySelector('.reviews-carousel__list');
    if (!reviewsList) return;

    const existingCards = reviewsList.querySelectorAll('.card-review').length;
    const targetReviewsCount = 40;
    if (existingCards >= targetReviewsCount) return;

    const names = [
      'Алексей Воронов', 'Марина Левченко', 'Ирина Соколова', 'Павел Шевченко',
      'Николай Денисов', 'Екатерина Орлова', 'Виктор Кравцов', 'Оксана Савельева',
      'Григорий Панченко', 'Анна Миронова', 'Сергей Руденко', 'Людмила Капустина',
      'Роман Киселёв', 'Наталья Мельник', 'Илья Богданов', 'Татьяна Журавлёва',
      'Денис Громов', 'Светлана Дьякова', 'Егор Сидоров', 'Ксения Назарова'
    ];

    const projects = [
      { name: 'Север', area: 118, type: 'Кирпичный' },
      { name: 'Альфа', area: 132, type: 'Газобетон' },
      { name: 'Вега', area: 98, type: 'Каркасный' },
      { name: 'Терра', area: 175, type: 'Кирпичный' },
      { name: 'Солярис', area: 148, type: 'Газобетон' },
      { name: 'Сканди', area: 112, type: 'Каркасный' },
      { name: 'Лофт', area: 145, type: 'Кирпичный' },
      { name: 'Эко', area: 88, type: 'Каркасный' }
    ];

    const reviewTexts = [
      'Работы шли по плану, прораб регулярно присылал фото и видео. По качеству вопросов нет.',
      'Понравилась прозрачная смета: все расходы были заранее понятны и без скрытых доплат.',
      'Команда аккуратная, участок после каждого этапа оставляли в порядке.',
      'Удобная коммуникация: всегда на связи, быстро отвечали на вопросы по материалам и срокам.',
      'Дом получился теплым и удобным по планировке. Живем постоянно, всё устраивает.',
      'Хорошо организовали этапы от фундамента до кровли, не затягивали работы.',
      'Помогли адаптировать проект под участок и бюджет, без потери качества.',
      'Всё сделали в рамках договора, подробно объясняли каждый этап строительства.'
    ];

    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    const formatDate = (index) => {
      const date = new Date(2025, index % 12, (index % 27) + 1);
      const iso = date.toISOString().split('T')[0];
      const text = `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      return { iso, text };
    };

    const escapeHtml = (value) => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    const stars = (rating) => (rating >= 5 ? '★★★★★' : '★★★★☆');
    const toAdd = targetReviewsCount - existingCards;
    const chunks = [];

    for (let i = 0; i < toAdd; i++) {
      const idx = existingCards + i;
      const name = names[idx % names.length];
      const project = projects[idx % projects.length];
      const text = reviewTexts[idx % reviewTexts.length];
      const rating = idx % 7 === 0 ? 4 : 5;
      const date = formatDate(idx + 3);

      chunks.push(`
        <article class="card-review card-review--real" role="listitem" itemscope itemtype="https://schema.org/Review">
          <span class="card-review-house-type">${escapeHtml(project.type)}</span>
          <div class="card-review-rating" aria-label="Оценка: ${rating} из 5">
            <span aria-hidden="true">${stars(rating)}</span>
          </div>
          <blockquote class="card-review-text" itemprop="reviewBody">
            <p class="mb-0">"${escapeHtml(text)}"</p>
          </blockquote>
          <footer class="card-review-author">
            <cite itemprop="author">${escapeHtml(name)}</cite>
            <time itemprop="datePublished" datetime="${date.iso}">${escapeHtml(date.text)}</time>
            <p class="card-review-house-project">Проект «${escapeHtml(project.name)}», ${project.area} м²</p>
          </footer>
          <div class="card-review-verified" aria-label="Проверенный отзыв">Проверенный отзыв</div>
        </article>
      `);
    }

    const hasSlick = typeof window.jQuery === 'function'
      && typeof window.jQuery.fn.slick === 'function'
      && window.jQuery(reviewsList).hasClass('slick-initialized');

    if (hasSlick) {
      const $list = window.jQuery(reviewsList);
      chunks.forEach((cardHtml) => {
        $list.slick('slickAdd', cardHtml);
      });
    } else {
      reviewsList.insertAdjacentHTML('beforeend', chunks.join(''));
    }
  };

  const renderConstructionSites = async () => {
    const list = document.getElementById('constructionSitesList');
    const liveStatValue = document.querySelector('.contact-live-stat__value');
    if (!list && !liveStatValue) return;

    const fallbackSites = [
      { name: 'Дом «Север 2»', address: 'г. Мариуполь, Ильичёвский район', stage: 'Фундамент', progress: 20 },
      { name: 'Дом «Терра 3»', address: 'г. Мариуполь, Центральный район', stage: 'Коробка', progress: 48 },
      { name: 'Дом «Солярис 5»', address: 'г. Мариуполь, Левобережный район', stage: 'Кровля', progress: 74 },
      { name: 'Дом «Вега 7»', address: 'г. Мариуполь, Приморский район', stage: 'Инженерные сети', progress: 82 }
    ];

    const getHouseWord = (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) return 'дом';
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дома';
      return 'домов';
    };

    const updateLiveStat = (rawCount) => {
      if (!liveStatValue) return;
      const count = Math.max(0, Math.floor(Number(rawCount) || 0));
      liveStatValue.textContent = `${count} ${getHouseWord(count)}`;
    };

    const render = (sites) => {
      if (!list) return;
      list.innerHTML = sites.map((site) => {
        const progress = Math.max(0, Math.min(100, Number(site.progress) || 0));
        return `
          <article class="construction-site-card" role="listitem">
            <h3 class="construction-site-card__title">${site.name}</h3>
            <p class="construction-site-card__address">${site.address}</p>
            <div class="construction-site-card__meta">
              <span>Этап: ${site.stage}</span>
              <span>${progress}%</span>
            </div>
            <div class="construction-site-card__progress" aria-hidden="true">
              <span style="width:${progress}%"></span>
            </div>
          </article>
        `;
      }).join('');
    };

    try {
      const response = await fetch('data/construction-sites.json');
      if (!response.ok) throw new Error('Failed to load sites');
      const payload = await response.json();
      const sites = Array.isArray(payload.sites) ? payload.sites : [];
      const normalizedSites = sites.length ? sites : fallbackSites;
      const configuredCount = Number(payload.activeCount);
      const count = Number.isFinite(configuredCount) ? configuredCount : normalizedSites.length;
      render(normalizedSites);
      updateLiveStat(count);
    } catch (error) {
      render(fallbackSites);
      updateLiveStat(fallbackSites.length);
    }
  };

  addMoreReviews();
  renderConstructionSites();

  
  let lastScrollY = 0;
  let ticking = false;
  const heroHeight = 600;

  const handleScroll = () => {
    const scrollY = window.scrollY;
    if (header) {
      if (scrollY > heroHeight - 100) {
        header.classList.add('header--opaque');
      } else {
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
        const navCollapse = document.getElementById('mainNav');
        if (navCollapse && navCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      }
    });
  });

  
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

  
  const filterGroups = document.querySelectorAll('[role="group"]');
  const filterEnterFrames = new WeakMap();

  const clearFilterEnterFrame = (item) => {
    const frameId = filterEnterFrames.get(item);
    if (typeof frameId === 'number') {
      cancelAnimationFrame(frameId);
      filterEnterFrames.delete(item);
    }
  };

  const hideFilterItem = (item) => {
    clearFilterEnterFrame(item);
    item.classList.add('is-filter-hidden');
    item.classList.remove('is-filter-enter');
    item.setAttribute('aria-hidden', 'true');
  };

  const showFilterItem = (item) => {
    clearFilterEnterFrame(item);
    const wasHidden = item.classList.contains('is-filter-hidden');
    item.classList.remove('is-filter-hidden');
    item.removeAttribute('aria-hidden');

    if (!wasHidden) return;

    item.classList.add('is-filter-enter');
    const frameId = requestAnimationFrame(() => {
      item.classList.remove('is-filter-enter');
      filterEnterFrames.delete(item);
    });
    filterEnterFrames.set(item, frameId);
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
      item.classList.remove('is-filter-enter');
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
          if (shouldShow) {
            showFilterItem(item);
          } else {
            hideFilterItem(item);
          }
        });
      });
    });
  });

  
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
  document.querySelectorAll('.service-card, .adv-card, .review-card, .step-card, .project-card, .type-card').forEach((el) => {
    el.style.opacity = '0';
    animateOnScroll.observe(el);
  });

  
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

  if (navbarCollapse && navbarToggler) {
    document.addEventListener('click', (event) => {
      const isNavbarOpen = navbarCollapse.classList.contains('show');
      const isClickInsideNavbar = navbarCollapse.contains(event.target);
      const isClickOnToggler = navbarToggler.contains(event.target);

      if (isNavbarOpen && !isClickInsideNavbar && !isClickOnToggler) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
    navbarCollapse.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        if (navbarCollapse.classList.contains('show')) {
          const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });
  }

  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        const bsModal = bootstrap.Modal.getInstance(openModal);
        if (bsModal) bsModal.hide();
      }
      closeAllFloatingPopups();
    }
  });

  
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
      const modal = document.getElementById('cookieSettingsModal');
      if (modal && bootstrap.Modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
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

  
})();
