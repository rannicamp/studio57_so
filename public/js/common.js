// common.js (CORRIGIDO E COMPLETO)
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from './firebase-config.js';

const auth = getAuth(app);

/**
 * Verifica o estado de autenticação do usuário e redireciona se não estiver logado.
 */
export function checkAuthAndRedirect(auth, redirectUrl, callback = null) {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log("Usuário não logado, redirecionando para login...");
            window.location.href = redirectUrl;
        } else {
            if (callback) {
                callback(user);
            }
        }
    });
}

/**
 * Lógica comum para o cabeçalho e a barra lateral (data/hora, info do usuário, logout, links ativos).
 */
export function initializeCommonUI(user) {
    const userInfoSpan = document.getElementById('user-info')?.querySelector('span');
    const currentDatetimeSpan = document.getElementById('current-datetime');
    const logoutButtonHeader = document.querySelector('.main-header #logout-button-header');
    const logoutLinkSidebar = document.getElementById('logout-link-sidebar');
    const pageTitleH1 = document.getElementById('page-title-header'); // Usando o H1 do header
    const navLinks = document.querySelectorAll('.sidebar .nav-link, #app-sidebar .nav-link');

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
        try {
            await signOut(auth);
            console.log("Logout bem-sucedido.");
            window.location.href = 'index.html'; // Redireciona para o login após o logout
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    logoutButtonHeader?.addEventListener('click', performLogout);
    logoutLinkSidebar?.addEventListener('click', performLogout);
    
    const currentPath = window.location.pathname.split('/').pop();
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            link.classList.add('active');
            const pageTitle = link.dataset.pageTitle;
            if (pageTitleH1 && pageTitle) pageTitleH1.textContent = pageTitle;
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
 * INCLUSÃO DA FUNÇÃO QUE FALTAVA
 * Inicializa a funcionalidade de recolher/expandir a barra lateral.
 */
export function initializeSidebarToggle() {
    // A sidebar pode ser carregada dinamicamente, então esperamos um pouco
    setTimeout(() => {
        const sidebar = document.getElementById('app-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        
        if (!sidebar || !toggleBtn) {
            console.warn("Elementos da sidebar não encontrados para inicializar o toggle.");
            return;
        }

        const mainContent = document.querySelector('.main-content-area-wrapper');
        const toggleIcon = toggleBtn.querySelector('i');
        const toggleText = toggleBtn.querySelector('.link-text');

        const updateToggleState = (isCollapsed) => {
            sidebar.classList.toggle('collapsed', isCollapsed);
            if (mainContent) {
                 mainContent.style.marginLeft = isCollapsed ? '72px' : '250px';
            }
            if (toggleIcon && toggleText) {
                if (isCollapsed) {
                    toggleIcon.classList.remove('fa-chevron-left');
                    toggleIcon.classList.add('fa-chevron-right');
                    toggleText.textContent = 'Expandir';
                } else {
                    toggleIcon.classList.remove('fa-chevron-right');
                    toggleIcon.classList.add('fa-chevron-left');
                    toggleText.textContent = 'Recolher';
                }
            }
        };

        // Aplica o estado salvo no localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        updateToggleState(isCollapsed);

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const currentlyCollapsed = sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', currentlyCollapsed);
            // Re-aplica o estilo de margem
            if (mainContent) {
                mainContent.style.marginLeft = currentlyCollapsed ? '72px' : '250px';
            }
            // Atualiza o ícone
            if (toggleIcon && toggleText) {
                 if (currentlyCollapsed) {
                    toggleIcon.classList.remove('fa-chevron-left');
                    toggleIcon.classList.add('fa-chevron-right');
                    toggleText.textContent = 'Expandir';
                } else {
                    toggleIcon.classList.remove('fa-chevron-right');
                    toggleIcon.classList.add('fa-chevron-left');
                    toggleText.textContent = 'Recolher';
                }
            }
        });

    }, 200); // Pequeno atraso para garantir que o HTML da sidebar foi carregado
}