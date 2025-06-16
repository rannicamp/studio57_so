// public/js/common.js

import { supabase } from '/js/supabase-config.js';

async function loadSidebar() {
    try {
        const response = await fetch('/sidebar.html'); 
        if (!response.ok) throw new Error(`Erro de rede: ${response.statusText}`);
        const sidebarHTML = await response.text();
        const placeholder = document.getElementById('sidebar-placeholder');
        if (placeholder) placeholder.innerHTML = sidebarHTML;
    } catch (error) {
        console.error('Falha crítica ao carregar o menu lateral:', error);
    }
}

export async function checkAuthAndRedirect() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/index.html'; // Caminho corrigido
    } else {
        await loadSidebar();
        initializeCommonUI(session.user);
    }
    supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) window.location.href = '/index.html'; // Caminho corrigido
    });
}

export function initializeCommonUI(user) {
    const userInfoSpan = document.getElementById('user-info')?.querySelector('span');
    const logoutButtonHeader = document.getElementById('logout-button-header');
    const logoutButtonSidebar = document.getElementById('logout-button-sidebar');
    const currentDatetimeSpan = document.getElementById('current-datetime');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    if (userInfoSpan && user && user.email) {
        userInfoSpan.textContent = user.email.split('@')[0];
    }

    const performLogout = async (event) => {
        event.preventDefault();
        showLoading('Saindo...');
        await supabase.auth.signOut();
    };

    logoutButtonHeader?.addEventListener('click', performLogout);
    logoutButtonSidebar?.addEventListener('click', performLogout);
    
    function updateDateTime() {
        if (!currentDatetimeSpan) return;
        const now = new Date();
        const formattedDate = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        currentDatetimeSpan.textContent = `${formattedDate} ${formattedTime}`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    const currentPath = window.location.pathname; 
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// Funções de utilidade (Toast e Loading)
export function showLoading(message = 'Carregando...') {
    let el = document.getElementById('loadingSpinner');
    if (!el) {
        el = document.createElement('div');
        el.id = 'loadingSpinner';
        document.body.appendChild(el);
    }
    el.innerHTML = `<div class="spinner"></div><p>${message}</p>`;
    el.style.display = 'flex';
}

export function hideLoading() {
    const el = document.getElementById('loadingSpinner');
    if (el) el.style.display = 'none';
}

export function showToast(type, title, message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    toast.innerHTML = `<div class="toast-icon"><i class="${icon}"></i></div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    const timeout = setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    });
}