/**
 * Gestion du formulaire de contact (Formspree).
 * - Validation inline (bordure rouge + message sous chaque champ)
 * - Honeypot anti-bot via champ _gotcha
 * - Spinner SVG pendant l'envoi
 * - Compteur de caractères sur le message
 * - Bouton disabled tant que le form n'est pas valide
 */

import { getCurrentLang } from './nav.js';

const LABELS = {
  fr: {
    sending: 'Envoi en cours...',
    submit: 'Envoyer le message',
    success: 'Merci ! Votre message est parti, je réponds vite.',
    error: "Oups, l'envoi a échoué. Essayez par email à redjemitechkraft@gmail.com",
    errors: {
      nameRequired: 'Le nom est requis.',
      nameMin: 'Au moins 2 caractères.',
      emailRequired: "L'email est requis.",
      emailInvalid: "Format d'email invalide.",
      subjectRequired: 'Sélectionnez un sujet.',
      messageRequired: 'Le message est requis.',
    },
  },
  en: {
    sending: 'Sending...',
    submit: 'Send message',
    success: 'Thanks! Your message is on its way, I reply soon.',
    error: 'Oops, sending failed. Try emailing me at redjemitechkraft@gmail.com',
    errors: {
      nameRequired: 'Name is required.',
      nameMin: 'At least 2 characters.',
      emailRequired: 'Email is required.',
      emailInvalid: 'Invalid email format.',
      subjectRequired: 'Choose a subject.',
      messageRequired: 'Message is required.',
    },
  },
};

function validateField(field, labels) {
  const name = field.name;
  const value = field.value.trim();

  if (name === 'name') {
    if (!value) return labels.errors.nameRequired;
    if (value.length < 2) return labels.errors.nameMin;
  }
  if (name === 'email') {
    if (!value) return labels.errors.emailRequired;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return labels.errors.emailInvalid;
  }
  if (name === 'subject') {
    if (!value) return labels.errors.subjectRequired;
  }
  if (name === 'message') {
    if (!value) return labels.errors.messageRequired;
  }
  return null;
}

function showFieldError(form, fieldName, errorMessage) {
  const field = form.querySelector(`[name="${fieldName}"]`);
  const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (!field || !errorEl) return;
  if (errorMessage) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('form-field__input--error');
    errorEl.textContent = errorMessage;
    errorEl.classList.add('form__error--visible');
  } else {
    field.removeAttribute('aria-invalid');
    field.classList.remove('form-field__input--error');
    errorEl.textContent = '';
    errorEl.classList.remove('form__error--visible');
  }
}

function showFeedback(el, kind, text) {
  if (!el) return;
  el.className = `form__feedback form__feedback--${kind}`;
  el.textContent = text;
}

function hideFeedback(el) {
  if (!el) return;
  el.className = 'form__feedback is-hidden';
  el.textContent = '';
}

export function initEmailCopy() {
  const buttons = document.querySelectorAll('[data-copy-email]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.copyEmail;
      if (!email) return;
      const lang = getCurrentLang();
      const hint = btn.querySelector('.direct-link__copy-hint');
      const original = hint?.textContent || '';
      try {
        await navigator.clipboard.writeText(email);
        if (hint) hint.textContent = lang === 'en' ? 'copied!' : 'copié !';
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.classList.remove('is-copied');
          if (hint) hint.textContent = original;
        }, 1800);
      } catch {
        // Fallback : ouvre mailto si clipboard refuse
        window.location.href = `mailto:${email}`;
      }
    });
  });
}

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const endpoint = form.dataset.formspreeEndpoint;
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn?.querySelector('.form__submit-label');
  const feedback = form.querySelector('[data-form-feedback]');
  const messageField = form.querySelector('[name="message"]');
  const charCounter = form.querySelector('[data-char-counter]');
  const honeypot = form.querySelector('[name="_gotcha"]');
  const lang = getCurrentLang();
  const labels = LABELS[lang] || LABELS.fr;

  // Compteur de caractères
  if (messageField && charCounter) {
    const max = messageField.getAttribute('maxlength') || 2500;
    const update = () => {
      const len = messageField.value.length;
      charCounter.textContent = `${len} / ${max}`;
      charCounter.classList.toggle('form__counter--warning', len > max * 0.9);
    };
    messageField.addEventListener('input', update);
    update();
  }

  // Validation inline au blur
  form.querySelectorAll('[name="name"], [name="email"], [name="subject"], [name="message"]').forEach((field) => {
    field.addEventListener('blur', () => {
      const err = validateField(field, labels);
      showFieldError(form, field.name, err);
    });
    field.addEventListener('input', () => {
      // Nettoyage immédiat de l'erreur si l'utilisateur corrige
      if (field.getAttribute('aria-invalid') === 'true') {
        const err = validateField(field, labels);
        if (!err) showFieldError(form, field.name, null);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback(feedback);

    // Honeypot — si rempli = bot
    if (honeypot && honeypot.value) {
      showFeedback(feedback, 'success', labels.success);
      return;
    }

    // Validation complète
    let hasError = false;
    form.querySelectorAll('[name="name"], [name="email"], [name="subject"], [name="message"]').forEach((field) => {
      const err = validateField(field, labels);
      showFieldError(form, field.name, err);
      if (err) hasError = true;
    });
    if (hasError) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    if (!endpoint) {
      showFeedback(feedback, 'error', labels.error);
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('form__submit--loading');
    if (submitLabel) submitLabel.textContent = labels.sending;

    try {
      const data = new FormData(form);
      const res = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        if (charCounter && messageField) {
          const max = messageField.getAttribute('maxlength') || 2500;
          charCounter.textContent = `0 / ${max}`;
        }
        showFeedback(feedback, 'success', labels.success);
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        showFeedback(feedback, 'error', labels.error);
      }
    } catch {
      showFeedback(feedback, 'error', labels.error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('form__submit--loading');
      if (submitLabel) submitLabel.textContent = labels.submit;
    }
  });
}
