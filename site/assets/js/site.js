// Small progressive enhancements shared across pages.

// Mobile menu
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
if (header && toggle) {
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

// Pricing: annual / monthly
const billing = document.querySelector('.billing-toggle');
if (billing) {
  billing.addEventListener('click', e => {
    const btn = e.target.closest('button[data-period]');
    if (!btn) return;
    const period = btn.dataset.period;
    billing.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    document.querySelectorAll('[data-annual]').forEach(el => {
      el.textContent = period === 'annual' ? el.dataset.annual : el.dataset.monthly;
    });
  });
}

// Copy buttons on code blocks
document.querySelectorAll('.codeblock').forEach(block => {
  const pre = block.querySelector('pre');
  if (!pre || !navigator.clipboard) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-btn';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Press Ctrl+C to copy';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  });
  block.appendChild(btn);
});

// Docs: filter the sidebar
const docSearch = document.querySelector('.docs__search');
if (docSearch) {
  const items = [...document.querySelectorAll('.docs__nav li')];
  const empty = document.querySelector('.no-results');
  docSearch.addEventListener('input', () => {
    const q = docSearch.value.trim().toLowerCase();
    let shown = 0;
    items.forEach(li => {
      const match = !q || li.textContent.toLowerCase().includes(q);
      li.hidden = !match;
      if (match) shown++;
    });
    document.querySelectorAll('.docs__nav section').forEach(s => {
      s.hidden = ![...s.querySelectorAll('li')].some(li => !li.hidden);
    });
    if (empty) empty.style.display = shown ? 'none' : 'block';
  });
}

// Contact form: validate, then show confirmation (no backend wired up yet)
const form = document.querySelector('#contact-form');
if (form) {
  const params = new URLSearchParams(location.search);
  const topic = params.get('topic');
  if (topic) {
    const radio = form.querySelector(`input[name="topic"][value="${CSS.escape(topic)}"]`);
    if (radio) radio.checked = true;
  }

  const messages = {
    name: 'Enter your name.',
    email: 'Enter a work email, like name@company.com.',
    company: 'Enter your company name.',
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstBad = null;
    for (const [field, msg] of Object.entries(messages)) {
      const input = form.elements[field];
      const err = document.getElementById(`${field}-error`);
      const ok = input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      err.textContent = ok ? '' : msg;
      if (!ok && !firstBad) firstBad = input;
    }
    if (firstBad) { firstBad.focus(); return; }

    const success = document.querySelector('.form-success');
    const chosen = form.querySelector('input[name="topic"]:checked');
    success.querySelector('[data-topic]').textContent =
      chosen ? chosen.nextElementSibling.textContent.toLowerCase() : 'your request';
    success.querySelector('[data-email]').textContent = form.elements.email.value;
    form.hidden = true;
    success.classList.add('is-shown');
    success.focus();
  });
}
