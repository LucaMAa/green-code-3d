const menuButton = document.getElementById('nav-toggle');
const navigationLinks = [...document.querySelectorAll('.nav-links a')];

function closeMenu() {
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Apri il menu');
}

menuButton?.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Chiudi il menu' : 'Apri il menu');
});

navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

const progressBar = document.getElementById('reading-progress');
let scrollScheduled = false;
window.addEventListener('scroll', () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight * 100 : 0;
    if (progressBar) progressBar.style.width = `${progress}%`;
    scrollScheduled = false;
  });
}, { passive: true });

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach((link) => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-22% 0px -68% 0px' });
document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

const usageResponses = {
  autocomplete: 'Un suggerimento mentre scrivi sembra piccolo, ma può comparire molte volte. Chiediti se lo usi davvero o se spesso lo ignori.',
  generate: 'Quando chiedi una funzione, controlla se il codice funziona e quante correzioni servono prima di usarlo.',
  agent: 'Un assistente può fare diversi passaggi da solo: cercare file, provare il codice e correggerlo. Più passaggi fa, più lavoro serve. È utile stabilire quando deve fermarsi.'
};
const choiceResponse = document.querySelector('#choice-response p');
document.querySelectorAll('.choice-button').forEach((button) => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    document.querySelectorAll('.choice-button').forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle('selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
    if (choiceResponse) choiceResponse.textContent = usageResponses[button.dataset.usage];
  });
});

function connectTabs(buttonSelector, panelSelector, key, clickFocus = false) {
  const buttons = [...document.querySelectorAll(buttonSelector)];
  const panels = [...document.querySelectorAll(panelSelector)];
  if (!buttons.length || !panels.length) return;

  function activate(button, focus = false) {
    const selectedKey = button.dataset[key];
    buttons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset[`${key}Panel`] !== selectedKey;
    });
    if (focus) button.focus();
  }

  buttons.forEach((button) => button.addEventListener('click', () => activate(button, clickFocus)));
  buttons.forEach((button, index) => button.addEventListener('keydown', (event) => {
    let nextIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % buttons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = buttons.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    activate(buttons[nextIndex], true);
  }));
  const initiallySelected = buttons.find((button) => button.getAttribute('aria-selected') === 'true') || buttons[0];
  activate(initiallySelected);
}

connectTabs('.phase-tab', '.phase-panel', 'phase', true);
connectTabs('.model-tab', '.model-panel', 'model', true);

const quizButton = document.getElementById('quiz-reveal');
const quizAnswer = document.getElementById('quiz-answer');
quizButton?.addEventListener('click', () => {
  const expanded = quizButton.getAttribute('aria-expanded') !== 'true';
  quizButton.setAttribute('aria-expanded', String(expanded));
  if (quizAnswer) quizAnswer.hidden = !expanded;
  const icon = quizButton.querySelector('span');
  if (icon) icon.textContent = expanded ? '−' : '+';
  quizButton.firstChild.textContent = expanded ? 'La risposta' : 'Ragioniamoci ';
});

const boundaryInputs = [...document.querySelectorAll('.boundary-option input')];
const boundaryCount = document.getElementById('boundary-count');
const boundaryMeter = document.getElementById('boundary-meter');
const boundarySummary = document.getElementById('boundary-summary');
function updateBoundary() {
  const selected = boundaryInputs.filter((input) => input.checked);
  const included = selected.map((input) => input.closest('.boundary-option').querySelector('b').textContent);
  const excluded = boundaryInputs.filter((input) => !input.checked)
    .map((input) => input.closest('.boundary-option').querySelector('b').textContent);
  if (boundaryCount) boundaryCount.textContent = `${selected.length} ${selected.length === 1 ? 'voce inclusa' : 'voci incluse'}`;
  if (boundaryMeter) boundaryMeter.style.width = `${selected.length / boundaryInputs.length * 100}%`;
  if (!boundarySummary) return;
  boundarySummary.textContent = selected.length
    ? `Incluse: ${included.join(', ')}. Restano fuori: ${excluded.length ? excluded.join(', ') : 'nessuna voce'}. Confronta solo risultati che considerano le stesse parti del sistema.`
    : 'Non hai incluso nessuna parte del sistema. Prima di confrontare le stime, scegli che cosa vuoi osservare.';
}
boundaryInputs.forEach((input) => input.addEventListener('change', updateBoundary));
updateBoundary();

const workloadControls = {
  requests: document.getElementById('request-slider'),
  context: document.getElementById('context-slider'),
  output: document.getElementById('output-slider'),
  retries: document.getElementById('retry-slider')
};
const workloadOutputs = {
  requests: document.getElementById('request-value'),
  context: document.getElementById('context-value'),
  output: document.getElementById('output-value'),
  retries: document.getElementById('retry-value'),
  calls: document.getElementById('daily-calls'),
  dailyTokens: document.getElementById('daily-tokens'),
  yearlyTokens: document.getElementById('yearly-tokens')
};
const numberFormat = new Intl.NumberFormat('it-IT');
const compactFormat = new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 });
function updateWorkload() {
  if (Object.values(workloadControls).some((control) => !control)) return;
  const values = Object.fromEntries(Object.entries(workloadControls).map(([key, control]) => [key, Number(control.value)]));
  const dailyCalls = values.requests * values.retries;
  const tokensPerCall = values.context + values.output;
  const dailyTokens = dailyCalls * tokensPerCall;
  const yearlyTokens = dailyTokens * 220;
  workloadOutputs.requests.textContent = numberFormat.format(values.requests);
  workloadOutputs.context.textContent = numberFormat.format(values.context);
  workloadOutputs.output.textContent = numberFormat.format(values.output);
  workloadOutputs.retries.textContent = numberFormat.format(values.retries);
  workloadOutputs.calls.textContent = numberFormat.format(dailyCalls);
  workloadOutputs.dailyTokens.textContent = numberFormat.format(dailyTokens);
  workloadOutputs.yearlyTokens.textContent = compactFormat.format(yearlyTokens);
}
Object.values(workloadControls).forEach((control) => control?.addEventListener('input', updateWorkload));
updateWorkload();
