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
 * Verifica se o usuário está logado. Redireciona conforme necessário.
 * Se uma função onAuthenticated for passada, ela é executada com os dados do usuário.
 * @param {function} [onAuthenticated] - Função opcional a ser executada se o usuário estiver autenticado.
 */
export async function checkAuthAndRedirect(onAuthenticated) {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error("Erro ao obter sessão:", error);
        return;
    }

    const user = session?.user;
    const isAuthPage = window.location.pathname.endsWith('index.html') ||
                       window.location.pathname.endsWith('register.html') ||
                       window.location.pathname.endsWith('forgot_password.html') ||
                       window.location.pathname === '/';

    if (user) {
        // Usuário está logado
        if (isAuthPage) {
            // Se está logado e em uma página de autenticação, vai para o dashboard
            window.location.href = 'dashboard.html';
            return;
        }
        // Se está logado e em uma página protegida, executa o callback
        if (typeof onAuthenticated === 'function') {
            onAuthenticated(user);
        }
    } else {
        // Usuário não está logado
        if (!isAuthPage) {
            // Se não está logado e tenta acessar uma página protegida, vai para o login
            window.location.href = 'index.html';
        }
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
        // Limpa qualquer intervalo anterior para evitar múltiplos timers
        if (window.datetimeInterval) {
            clearInterval(window.datetimeInterval);
        }
        // Inicia um novo intervalo e armazena sua referência
        window.datetimeInterval = setInterval(() => {
            currentDatetimeDiv.textContent = new Date().toLocaleString('pt-BR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }, 1000);
    }

    // Adiciona o evento de clique aos botões de logout de forma segura
    const setupLogoutButtons = () => {
        const headerButton = document.getElementById('logout-button-header');
        const sidebarButton = document.getElementById('logout-button-sidebar');

        if (headerButton) {
            headerButton.removeEventListener('click', handleLogout); // Remove listener antigo
            headerButton.addEventListener('click', handleLogout); // Adiciona novo
        }
        if (sidebarButton) {
            sidebarButton.removeEventListener('click', handleLogout); // Remove listener antigo
            sidebarButton.addEventListener('click', handleLogout); // Adiciona novo
        }
    };
    
    // O componente da sidebar pode demorar um pouco para carregar,
    // então verificamos repetidamente por um curto período.
    setTimeout(setupLogoutButtons, 100);
    setTimeout(setupLogoutButtons, 500);
}


/**
 * Controla a funcionalidade de recolher/expandir a barra lateral.
 */
export function initializeSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
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
    let spinner = document.getElementById('loadingSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.className = 'loading-overlay';
        spinner.id = 'loadingSpinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(spinner);
    }
    spinner.style.display = 'flex';
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
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    };

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

    // Força o navegador a aplicar a classe inicial antes de adicionar a classe 'show'
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            // Verifica se o toast ainda está no DOM antes de tentar remover
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        });
    };
    
    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, 5000);
}