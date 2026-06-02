// ═══════════════════════════════════════════════════════
//  ui-helpers.js  —  Header, Nav y Toast compartidos
// ═══════════════════════════════════════════════════════

import { logout } from './firebase-config.js';

// ── Renderiza el header con datos del usuario ─────────
export function renderHeader(profile, role, activePage) {
  const name     = profile.fullName || '—';
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const isStaff  = role === 'staff';

  document.getElementById('userAvatar').textContent  = initials;
  document.getElementById('userAvatar').className    = `avatar ${isStaff?'staff':'patient'}`;
  document.getElementById('userName').textContent    = name.split(' ')[0];
  document.getElementById('userRoleTag').textContent = isStaff ? 'Personal' : 'Paciente';
  document.getElementById('userRoleTag').className   = `role-tag ${isStaff?'staff':'patient'}`;
}

// ── Renderiza la barra de navegación glassmorphism ────
export function renderNav(role, activePage) {
  const isStaff = role === 'staff';

  // Páginas de paciente
  const patientPages = [
    { href:'mis-citas.html',  label:'Mis Citas',  icon:calIcon() },
    { href:'nueva-cita.html', label:'Nueva Cita', icon:plusIcon() },
    { href:'historial.html',  label:'Historial',  icon:listIcon() },
  ];

  // Páginas de personal
  const staffPages = [
    { href:'agenda.html',    label:'Agenda',    icon:calIcon() },
    { href:'doctores.html',  label:'Doctores',  icon:userIcon() },
    { href:'bloqueos.html',  label:'Bloqueos',  icon:lockIcon() },
  ];

  const pages = isStaff ? staffPages : patientPages;

  const nav = document.getElementById('glassNav');
  nav.innerHTML = pages.map(p => `
    <a href="${p.href}" class="gn-btn ${activePage===p.href?'active':''}" title="${p.label}">
      ${p.icon}
    </a>
  `).join('<div class="gn-sep"></div>') +
  `<div class="gn-sep"></div>
   <button class="gn-btn" title="Salir" onclick="doLogout()">
     ${logoutIcon()}
   </button>`;
}

window.doLogout = () => logout();

// ── Toast ─────────────────────────────────────────────
let toastTimer;
export function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  el.className = `toast ${type} show`;
  document.getElementById('toastIcon').textContent = icons[type]||'✓';
  document.getElementById('toastMsg').textContent  = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Modal helpers ─────────────────────────────────────
export function openModal(id)  { document.getElementById(id).classList.add('open'); }
export function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Cerrar modal al hacer clic en el backdrop
export function initModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m =>
    m.addEventListener('click', e => { if(e.target===m) m.classList.remove('open'); })
  );
}

// ── SVG Icons ─────────────────────────────────────────
function calIcon()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
function plusIcon()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`; }
function listIcon()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`; }
function userIcon()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`; }
function lockIcon()   { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`; }
function logoutIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`; }