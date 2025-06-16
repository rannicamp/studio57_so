// public/js/common.js

// Importa o cliente supabase
import { supabase } from './supabase-config.js';

/**
 * Verifica o estado de autenticação do usuário e redireciona se não estiver logado.
 */
export async function checkAuthAndRedirect(redirectUrl, callback = null) {
    // Pega a sessão atual do usuário no Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Se não houver sessão (usuário não logado), redireciona
        console.log("Usuário não logado, redirecionando para login...");
        window.location.href = redirectUrl;
    } else {
        // Se houver uma sessão, executa a função de callback com os dados do usuário
        if (callback) {
            callback(session.user);
        }
    }

    // Fica "escutando" por mudanças no login (ex: usuário fez logout em outra aba)
    supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
            console.log("Sessão expirou ou usuário deslogou. Redirecionando...");
            window.location.href = redirectUrl;
        }
    });
}


/**
 * Lógica comum para o cabeçalho e a barra lateral (data/hora, info do usuário, logout, links ativos).
 */
export function initializeCommonUI(user) {
    const userInfoSpan = document.getElementById('user-info')?.querySelector('span');
    const currentDatetimeSpan = document.getElementById('current-datetime');
    const logoutButtonHeader = document.getElementById('logout-button-header');
    const logoutButtonSidebar = document.getElementById('logout-button-sidebar');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    if (userInfoSpan && user && user.email) {
        userInfoSpan.textContent = user.email;
    }

    function updateDateTime() {
        if (!currentDatetimeSpan) return;
        const now = new Date();
        const formattedDate = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        currentDatetimeSpan.textContent = `${formattedDate} ${formattedTime}`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const performLogout = async (event) => {
        event.preventDefault();
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Erro ao fazer logout:", error);
        } else {
            // checkAuthAndRedirect fará o redirecionamento automático
            console.log("Logout bem-sucedido.");
            window.location.href = 'index.html'; // Garante o redirecionamento
        }
    };

    logoutButtonHeader?.addEventListener('click', performLogout);
    logoutButtonSidebar?.addEventListener('click', performLogout);

    const currentPath = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            link.classList.add('active');
        }
    });
}


/**
 * Exibe um spinner de carregamento em tela cheia.
 */
export function showLoading() {
    const loadingSpinnerEl = document.getElementById('loadingSpinner');
    if (loadingSpinnerEl) {
        loadingSpinnerEl.style.display = 'flex';
    }
}

/**
 * Oculta o spinner de carregamento em tela cheia.
 */
export function hideLoading() {
    const loadingSpinnerEl = document.getElementById('loadingSpinner');
    if (loadingSpinnerEl) {
        loadingSpinnerEl.style.display = 'none';
    }
}

/**
 * Exibe uma mensagem de toast no canto da tela.
 */
export function showToast(type, title, message) {
    const toastContainerEl = document.getElementById('toastContainer');
    if (!toastContainerEl) {
        console.warn("Elemento 'toastContainer' não encontrado. Exibindo alerta padrão.");
        alert(`${title}: ${message}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

    toast.innerHTML = `
        <div class="toast-icon"><i class="${iconClass}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    toastContainerEl.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const autoCloseTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode === toastContainerEl) toastContainerEl.removeChild(toast); }, 300);
    }, 5000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoCloseTimeout);
        toast.classList.remove('show');
        setTimeout(() => { if (toast.parentNode === toastContainerEl) toastContainerEl.removeChild(toast); }, 300);
    });
}


/**
 * Carrega um componente HTML de um arquivo e o injeta em um elemento da página.
 */
export async function loadHTMLComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Erro de rede ao carregar o componente: ${response.statusText}`);
        }
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        } else {
            console.error(`Placeholder com ID '${elementId}' não encontrado na página.`);
        }
    } catch (error) {
        console.error(`Falha ao carregar o componente de '${filePath}':`, error);
    }
}

/**
 * Inicializa a funcionalidade de recolher/expandir a barra lateral.
 */
export function initializeSidebarToggle() {
    setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle-btn');

        if (!sidebar || !toggleBtn) {
            console.warn("Elementos da sidebar não encontrados para inicializar o toggle.");
            return;
        }

        const mainContent = document.querySelector('.main-content-area-wrapper');

        const updateToggleState = (isCollapsed) => {
            document.body.classList.toggle('sidebar-collapsed', isCollapsed);
            sidebar.classList.toggle('collapsed', isCollapsed);
            if (mainContent) {
                 mainContent.style.marginLeft = isCollapsed ? '72px' : '250px';
            }
        };

        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        updateToggleState(isCollapsed);

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentlyCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', currentlyCollapsed);
            document.body.classList.toggle('sidebar-collapsed', currentlyCollapsed);
            if (mainContent) {
                mainContent.style.marginLeft = currentlyCollapsed ? '72px' : '250px';
            }
        });

    }, 200);
}