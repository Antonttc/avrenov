/* ==========================================================================
   AVRenov — Main JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavCollapse();
  initServiceTypeFilter();
  initBeforeAfterSliders();
  initDevisForm();
});

/**
 * 1. Close mobile Bootstrap navbar collapse when an anchor link is clicked
 */
function initMobileNavCollapse() {
  const navCollapseEl = document.getElementById('navbarAvrenov');
  if (!navCollapseEl || typeof bootstrap === 'undefined') return;

  const navLinks = navCollapseEl.querySelectorAll('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (!navCollapseEl.classList.contains('show')) return;
      const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navCollapseEl, {
        toggle: false,
      });
      collapseInstance.hide();
    });
  });
}

/**
 * 2. Filter services by property type (all, appartement, maison, commercial)
 */
function initServiceTypeFilter() {
  const filterGroup = document.getElementById('propertyTypeFilter');
  const serviceItems = document.querySelectorAll('#servicesGrid .service-item');
  if (!filterGroup || !serviceItems.length) return;

  const buttons = filterGroup.querySelectorAll('button[data-filter]');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.dataset.filter || 'all';

      // Toggle active Bootstrap button classes
      buttons.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.classList.toggle('btn-brand', isActive);
        b.classList.toggle('btn-outline-brand', !isActive);
      });

      // Filter service cards
      serviceItems.forEach((item) => {
        const types = (item.dataset.types || '')
          .split(/\s+/)
          .filter(Boolean);

        const shouldShow =
          selectedFilter === 'all' || types.includes(selectedFilter);

        item.classList.toggle('is-hidden', !shouldShow);
      });
    });
  });
}

/**
 * 3. Interactive Before / After comparison sliders
 */
function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('[data-ba-compare]');
  if (!sliders.length) return;

  const instances = [];

  sliders.forEach((container) => {
    const range = container.querySelector('.ba-range');
    const beforeWrap = container.querySelector('.ba-before-wrap');
    const beforeImg = container.querySelector('.ba-before');
    const divider = container.querySelector('.ba-divider');

    if (!range || !beforeWrap || !divider) return;

    const syncDimensions = () => {
      const containerWidth = container.clientWidth;
      if (beforeImg && containerWidth > 0) {
        beforeImg.style.width = `${containerWidth}px`;
        beforeImg.style.maxWidth = 'none';
      }
    };

    const updatePosition = (rawValue) => {
      const numeric = Number(rawValue);
      const clamped = Number.isFinite(numeric)
        ? Math.min(100, Math.max(0, numeric))
        : 50;

      beforeWrap.style.width = `${clamped}%`;
      divider.style.left = `${clamped}%`;
    };

    syncDimensions();
    updatePosition(range.value);

    range.addEventListener('input', (e) => {
      updatePosition(e.target.value);
    });

    range.addEventListener('change', (e) => {
      updatePosition(e.target.value);
    });

    instances.push({ syncDimensions });
  });

  window.addEventListener('resize', () => {
    instances.forEach((inst) => inst.syncDimensions());
  });
}

/**
 * 4. Devis form validation & submission via fetch()
 */
function initDevisForm() {
  const form = document.getElementById('devisForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');

  if (!form || !feedback || !submitBtn) return;

  const defaultBtnText = submitBtn.textContent.trim() || 'Envoyer ma demande';

  const showFeedback = (type, message) => {
    feedback.className = `alert alert-${type} mb-0`;
    feedback.textContent = message;
  };

  const clearFeedback = () => {
    feedback.className = 'alert d-none mb-0';
    feedback.textContent = '';
  };

  const setSubmitting = (isSubmitting) => {
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? 'Envoi en cours...' : defaultBtnText;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFeedback();

    form.classList.add('was-validated');

    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid && typeof firstInvalid.focus === 'function') {
        firstInvalid.focus();
      }
      showFeedback(
        'warning',
        'Veuillez vérifier les champs obligatoires avant d’envoyer votre demande.'
      );
      return;
    }

    const actionUrl = form.getAttribute('action') || 'assets/api/send.php';
    const method = (form.getAttribute('method') || 'POST').toUpperCase();
    const formData = new FormData(form);

    setSubmitting(true);

    try {
      const response = await fetch(actionUrl, {
        method,
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      let payload = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        payload = await response.json().catch(() => null);
      }

      if (!response.ok || (payload && payload.ok === false)) {
        const errMsg =
          (payload && payload.message) ||
          'Une erreur est survenue lors de l’envoi. Vous pouvez également nous appeler au +33 7 58 06 91 12 ou écrire à contact@avrenov.fr.';
        showFeedback('danger', errMsg);
        return;
      }

      const successMsg =
        (payload && payload.message) ||
        'Votre demande a bien été envoyée. Nous vous répondrons sous 24h.';
      showFeedback('success', successMsg);
      form.reset();
      form.classList.remove('was-validated');
    } catch (error) {
      showFeedback(
        'danger',
        'Impossible d’envoyer le formulaire pour le moment. Contactez-nous directement par téléphone (+33 7 58 06 91 12) ou sur contact@avrenov.fr.'
      );
    } finally {
      setSubmitting(false);
    }
  });
}



