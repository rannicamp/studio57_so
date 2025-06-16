// public/js/common.js

// Importa o cliente supabase
import { supabase } from './supabase-config.js';

/**
 * Verifica o estado de autenticação do usuário e redireciona se não estiver logado.
 * Esta função é chamada em todas as páginas que precisam de login.
 */
export async function checkAuthAndRedirect() {
    // Pega a sessão atual do usuário no Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Se não houver sessão (usuário não logado), redireciona para a página de login.
        console.log("Usuário não logado, redirecionando...");
        // Usamos 'index.html' como a página de login.
        window.location.href = 'index.html'; 
    } else {
        // Se houver uma sessão, o usuário está logado.
        // Inicializamos a interface comum (cabeçalho, menu lateral) com os dados do usuário.
        initializeCommonUI(session.user);
    }

    // Fica "escutando" por mudanças no login (ex: usuário fez logout em outra aba)
    supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
            console.log("Sessão expirou ou usuário deslogou. Redirecionando...");
            window.location.href = 'index.html';
        }
    });
}


/**
 * Inicializa os elementos comuns da interface, como cabeçalho e menu.
 */
export function initializeCommonUI(user) {
    // Carrega o menu lateral (sidebar)
    loadHTMLComponent('sidebar-placeholder', 'sidebar.html').then(() => {
        // Depois que o HTML do menu for carregado, podemos adicionar a lógica a ele.
        
        const userInfoSpan = document.getElementById('user-info')?.querySelector('span');
        const logoutButtonSidebar = document.getElementById('logout-button-sidebar');

        if (userInfoSpan && user && user.email) {
            userInfoSpan.textContent = user.email.split('@')[0]; // Mostra apenas a parte antes do @
        }

        const performLogout = async (event) => {
            event.preventDefault();
            showLoading('Saindo...');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Erro ao fazer logout:", error);
                hideLoading();
                showToast('error', 'Erro', 'Não foi possível sair. Tente novamente.');
            } else {
                // O redirecionamento já é feito pelo 'onAuthStateChange'
                console.log("Logout bem-sucedido.");
            }
        };

        if (logoutButtonSidebar) {
            logoutButtonSidebar.addEventListener('click', performLogout);
        }

        // Ativa o link do menu correspondente à página atual
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        const currentPath = window.location.pathname.split('/').pop();
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    });

    const currentDatetimeSpan = document.getElementById('current-datetime');
    const logoutButtonHeader = document.getElementById('logout-button-header');
    
    // Atualiza a data e a hora a cada segundo
    function updateDateTime() {
        if (!currentDatetimeSpan) return;
        const now = new Date();
        const formattedDate = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const formattedTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        currentDatetimeSpan.textContent = `${formattedDate} ${formattedTime}`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const performLogout = async (event) => {
        event.preventDefault();
        showLoading('Saindo...');
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Erro ao fazer logout:", error);
            hideLoading();
        }
    };

    if(logoutButtonHeader) {
        logoutButtonHeader.addEventListener('click', performLogout);
    }
}


/**
 * Exibe um spinner de carregamento em tela cheia.
 */
export function showLoading(message = 'Carregando...') {
    let loadingSpinnerEl = document.getElementById('loadingSpinner');
    if (!loadingSpinnerEl) {
        loadingSpinnerEl = document.createElement('div');
        loadingSpinnerEl.id = 'loadingSpinner';
        document.body.appendChild(loadingSpinnerEl);
    }