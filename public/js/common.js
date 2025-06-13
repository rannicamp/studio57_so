// public/js/common.js

import { supabaseClient as supabase } from './supabase-config.js';

/**
 * Carrega um componente HTML (como a sidebar) em um elemento da página.
 * @param {string} elementId - O ID do elemento onde o HTML será inserido.
 * @param {string} url - O caminho para o arquivo HTML a ser carregado.
 */
export async function loadHTMLComponent(elementId, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Não foi possível carregar ${url}`);
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        }
    } catch (error) {
        console.error(`Erro ao carregar o componente ${url}:`, error);
    }
}

/**
 * Verifica se o usuário está logado. Se não estiver, redireciona para a página de login.
 * Se estiver logado e em uma página de autenticação (login/registro), redireciona para o dashboard.
 * @param {function} onAuthenticated - Uma função para ser executada se o usuário estiver autenticado.
 */
export async function checkAuthAndRedirect(onAuthenticated) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const isAuthPage = ['/index.html', '/register.html', '/forgot_password.html', '/', '/public/', '/public/index.html'].includes(window.location.pathname);

    if (!user && !isAuthPage) {
        window.location.href = '/index.html';
    } else if (user && isAuthPage) {
        window.location.href = '/dashboard.html';
    } else if (user && typeof onAuthenticated === 'function') {
        onAuthenticated(user);
    } else if (!user && isAuthPage && typeof onAuthenticated === 'function') {
        onAuthenticated(null); // Permite executar algo nas páginas de auth, se necessário
    }
}


/**
 * Realiza o logout do usuário e o redireciona para a página de login.
 */
async function handleLogout() {
    showLoading();
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
        showToast('error', 'Erro', 'Não foi possível sair. Tente novamente.');
    } else {
        window.location.href = 'index.html';
    }
    hideLoading();
}

/**
 * Inicializa a interface comum do usuário (informações do header, botões de logout).
 * @param {object} user - O objeto do usuário autenticado do Supabase.
 */
export function initializeCommonUI(user) {
    if (!user) return;

    const userInfoDiv = document.getElementById('user-info');
    const currentDatetimeDiv = document.getElementById('current-datetime');
    
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `Usuário: <span class="font-semibold">${user.email}</span>`;
    }

    if (currentDatetimeDiv) {
        setInterval(() => {
            currentDatetimeDiv.textContent = new Date().toLocaleString('pt-BR');
        }, 1000);
    }

    // Adiciona o evento de clique aos botões de logout
    document.querySelectorAll('#logout-button-header, #logout-button-sidebar').forEach(btn => {
        if(btn) {
            // Remove qualquer evento antigo para evitar duplicação
            btn.replaceWith(btn.cloneNode(true));
        }
    });
     document.querySelectorAll('#logout-button-header, #logout-button-sidebar').forEach(btn => {
        if(btn) btn.addEventListener('click', handleLogout);
    });
}

/**
 * Controla a funcionalidade de recolher/expandir a barra lateral.
 */
export function initializeSidebarToggle() {
    const sidebar = document.getElementById('sidebar-placeholder');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mainContent = document.querySelector('.main-content-area-wrapper');

    if (sidebar && toggleBtn && mainContent) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('collapsed');
        });
    }
}

// --- Funções Utilitárias de UI (centralizadas aqui) ---

/** Mostra o ícone de carregamento (spinner) */
export function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';
}

/** Esconde o ícone de carregamento (spinner) */
export function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

/**
 * Mostra uma notificação (toast) na tela.
 * @param {'success'|'error'|'info'|'warning'} type - O tipo de notificação.
 * @param {string} title - O título da notificação.
 * @param {string} message - A mensagem da notificação.
 */
export function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div class="toast-content">
            <p class="toast-title">${title}</p>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    };
    
    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, 5000);
}