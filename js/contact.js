/**
 * Gestion du formulaire de contact (Formspree).
 * L'endpoint doit être renseigné dans data-formspree-endpoint sur le <form>.
 */

import { getCurrentLang } from './nav.js';

export function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const endpoint = form.dataset.formspreeEndpoint;
  const submitBtn = form.querySelector('button[type="submit"]');
  const feedback = form.querySelector('[data-form-feedback]');
  const lang = getCurrentLang();

  const labels = {
    fr: {
      sending: 'Envoi en cours...',
      submit: 'Envoyer le message',
      success: 'Merci ! Ton message est parti, je te réponds vite.',
      error: 'Oups, l\'envoi a échoué. Essaie par email à redjemitechkraft@gmail.com',
    },
    en: {
      sending: 'Sending...',
      submit: 'Send message',
      success: 'Thanks! Your message is on its way, I\'ll reply soon.',
      error: 'Oops, sending failed. Try emailing me at redjemitechkraft@gmail.com',
    },
  }[lang];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!endpoint) {
      showFeedback(feedback, 'error', labels.error);
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = labels.sending;
    if (feedback) feedback.className = 'form__feedback is-hidden';

    try {
      const data = new FormData(form);
      const res = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        form.reset();
        showFeedback(feedback, 'success', labels.success);
      } else {
        showFeedback(feedback, 'error', labels.error);
      }
    } catch {
      showFeedback(feedback, 'error', labels.error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function showFeedback(el, kind, text) {
  if (!el) return;
  el.className = `form__feedback form__feedback--${kind}`;
  el.textContent = text;
}
