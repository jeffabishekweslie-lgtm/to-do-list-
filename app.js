/**
 * MISSION LOG — Core Application Logic
 * Handles objective CRUD, filtering, persistence, and animations.
 */

(function () {
  'use strict';

  // ─── DOM REFERENCES ───────────────────────────────────────
  const inputField = document.getElementById('objective-input');
  const threatSelect = document.getElementById('threat-select');
  const btnDeploy = document.getElementById('btn-deploy');
  const objectivesList = document.getElementById('objectives-list');
  const filterBar = document.getElementById('filter-bar');
  const footerTimestamp = document.getElementById('footer-timestamp');
  const footerStatus = document.getElementById('footer-status');

  const statActive = document.getElementById('stat-active');
  const statSecured = document.getElementById('stat-secured');
  const statRedacted = document.getElementById('stat-redacted');

  // ─── STATE ────────────────────────────────────────────────
  const STORAGE_KEY = 'missionlog_objectives';
  let objectives = loadObjectives();
  let currentFilter = 'all';
  let redactedCount = loadRedactedCount();

  // ─── PERSISTENCE ──────────────────────────────────────────
  function loadObjectives() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveObjectives() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
  }

  function loadRedactedCount() {
    try {
      return parseInt(localStorage.getItem('missionlog_redacted') || '0', 10);
    } catch {
      return 0;
    }
  }

  function saveRedactedCount() {
    localStorage.setItem('missionlog_redacted', redactedCount.toString());
  }

  // ─── UNIQUE ID GENERATOR ─────────────────────────────────
  function generateId() {
    return 'obj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  }

  // ─── CREATE OBJECTIVE ─────────────────────────────────────
  function createObjective(text, threat = 'green') {
    const trimmed = text.trim();
    if (!trimmed) return;

    const objective = {
      id: generateId(),
      text: trimmed,
      status: 'active', // 'active' | 'secured'
      threat: threat,    // 'green' | 'amber' | 'red'
      createdAt: Date.now(),
    };

    objectives.unshift(objective);
    saveObjectives();
    updateStats();
    renderObjectives();
    showToast('Objective deployed', 'success');
    updateFooterStatus('OBJECTIVE DEPLOYED');
  }

  // ─── SECURE (COMPLETE) OBJECTIVE ──────────────────────────
  function secureObjective(id) {
    const obj = objectives.find(o => o.id === id);
    if (!obj || obj.status === 'secured') return;

    // Trigger animation
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.classList.add('objective-card--securing');

    setTimeout(() => {
      obj.status = 'secured';
      saveObjectives();
      updateStats();
      renderObjectives();
      showToast('Objective secured', 'secure');
      updateFooterStatus('OBJECTIVE SECURED');
    }, 600);
  }

  // ─── REACTIVATE OBJECTIVE ─────────────────────────────────
  function reactivateObjective(id) {
    const obj = objectives.find(o => o.id === id);
    if (!obj || obj.status === 'active') return;

    obj.status = 'active';
    saveObjectives();
    updateStats();
    renderObjectives();
    showToast('Objective reactivated', 'success');
    updateFooterStatus('OBJECTIVE REACTIVATED');
  }

  // ─── REDACT (DELETE) OBJECTIVE ────────────────────────────
  function redactObjective(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.add('objective-card--redacting');
      setTimeout(() => {
        objectives = objectives.filter(o => o.id !== id);
        redactedCount++;
        saveObjectives();
        saveRedactedCount();
        updateStats();
        renderObjectives();
        updateFooterStatus('OBJECTIVE REDACTED');
      }, 500);
    } else {
      objectives = objectives.filter(o => o.id !== id);
      redactedCount++;
      saveObjectives();
      saveRedactedCount();
      updateStats();
      renderObjectives();
    }
    showToast('Objective redacted', 'redact');
  }

  // ─── RENDER ───────────────────────────────────────────────
  function renderObjectives() {
    const filtered = getFilteredObjectives();
    objectivesList.innerHTML = '';

    if (filtered.length === 0) {
      objectivesList.innerHTML = renderEmptyState();
      return;
    }

    filtered.forEach((obj, index) => {
      const card = document.createElement('div');
      card.className = `objective-card objective-card--${obj.threat}${obj.status === 'secured' ? ' objective-card--secured' : ''}`;
      card.dataset.id = obj.id;
      card.style.animationDelay = `${index * 0.05}s`;

      const statusClass = obj.status === 'active' ? 'objective-card__status--active' : 'objective-card__status--secured';
      const statusLabel = obj.status === 'active' ? 'Active' : 'Secured';

      const threatLabels = { green: 'Low', amber: 'Medium', red: 'Critical' };

      let actionButtons = '';
      if (obj.status === 'active') {
        actionButtons = `
          <button class="btn-action btn-secure" onclick="MissionLog.secure('${obj.id}')" aria-label="Secure objective" title="Mark as Secured">
            Secure
          </button>
          <button class="btn-action btn-redact" onclick="MissionLog.redact('${obj.id}')" aria-label="Redact objective" title="Redact (delete)">
            Redact
          </button>
        `;
      } else {
        actionButtons = `
          <button class="btn-action btn-reactivate" onclick="MissionLog.reactivate('${obj.id}')" aria-label="Reactivate objective" title="Reactivate objective">
            Reactivate
          </button>
          <button class="btn-action btn-redact" onclick="MissionLog.redact('${obj.id}')" aria-label="Redact objective" title="Redact (delete)">
            Redact
          </button>
        `;
      }

      card.innerHTML = `
        <span class="objective-card__status ${statusClass}">${statusLabel}</span>
        <span class="objective-card__threat threat--${obj.threat}">${threatLabels[obj.threat]}</span>
        <span class="objective-card__text">${escapeHtml(obj.text)}</span>
        <div class="objective-card__actions">
          ${actionButtons}
        </div>
      `;

      objectivesList.appendChild(card);
    });
  }

  function renderEmptyState() {
    const messages = {
      all: 'No objectives deployed. Enter a designation above.',
      active: 'No active objectives. All clear, operative.',
      secured: 'No secured objectives yet. Get to work.',
      green: 'No low-threat objectives found.',
      amber: 'No medium-threat objectives found.',
      red: 'No critical objectives found.',
    };

    return `
      <div class="empty-state">
        <div class="empty-state__icon">◇</div>
        <div class="empty-state__title">Sector Clear</div>
        <div class="empty-state__text">${messages[currentFilter] || messages.all}</div>
      </div>
    `;
  }

  // ─── FILTERING ────────────────────────────────────────────
  function getFilteredObjectives() {
    switch (currentFilter) {
      case 'active':
        return objectives.filter(o => o.status === 'active');
      case 'secured':
        return objectives.filter(o => o.status === 'secured');
      case 'green':
      case 'amber':
      case 'red':
        return objectives.filter(o => o.threat === currentFilter && o.status === 'active');
      default:
        return objectives;
    }
  }

  function setFilter(filter) {
    currentFilter = filter;

    // Update active tab styling
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('filter-btn--active', btn.dataset.filter === filter);
    });

    renderObjectives();
  }

  // ─── STATS ────────────────────────────────────────────────
  function updateStats() {
    const active = objectives.filter(o => o.status === 'active').length;
    const secured = objectives.filter(o => o.status === 'secured').length;

    animateCounter(statActive, active);
    animateCounter(statSecured, secured);
    animateCounter(statRedacted, redactedCount);
  }

  function animateCounter(element, target) {
    const current = parseInt(element.textContent, 10) || 0;
    if (current === target) return;

    const diff = target - current;
    const duration = 400;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      element.textContent = Math.round(current + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // ─── TOAST ────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = `> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--exit');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ─── FOOTER ───────────────────────────────────────────────
  function updateTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    footerTimestamp.textContent = `${hours}:${minutes}:${seconds}`;
  }

  function updateFooterStatus(msg) {
    footerStatus.textContent = `STATUS: ${msg}`;
    setTimeout(() => {
      footerStatus.textContent = 'STATUS: OPERATIONAL';
    }, 3000);
  }

  // ─── UTILITIES ────────────────────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ─── EVENT HANDLERS ───────────────────────────────────────
  btnDeploy.addEventListener('click', () => {
    createObjective(inputField.value, threatSelect.value);
    inputField.value = '';
    inputField.focus();
  });

  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      createObjective(inputField.value, threatSelect.value);
      inputField.value = '';
    }
  });

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (btn) setFilter(btn.dataset.filter);
  });

  // ─── INIT ─────────────────────────────────────────────────
  function init() {
    updateStats();
    renderObjectives();
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    inputField.focus();
  }

  // ─── PUBLIC API (for inline onclick handlers) ─────────────
  window.MissionLog = {
    secure: secureObjective,
    redact: redactObjective,
    reactivate: reactivateObjective,
  };

  // Boot
  init();
})();
