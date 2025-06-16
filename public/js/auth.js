// public/js/auth.js

// Importa o cliente Supabase configurado e as funções comuns
import { supabase } from './supabase-config.js';
import { showToast, showLoading, hideLoading } from './common.js';

// Adiciona um listener para o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se estamos na página de login
    if (document.getElementById('loginForm')) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', handleLogin);
    }

    // Verifica se estamos na página de registro
    if (document.getElementById('registerForm')) {
        const registerForm = document.getElementById('registerForm');
        registerForm.addEventListener('submit', handleRegister);
    }

    // Verifica se estamos na página de recuperação de senha
    if (document.getElementById('forgotPasswordForm')) {
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    // Listener para o estado de autenticação (quando o usuário loga ou desloga)
    // Isso é útil para redirecionar usuários ou atualizar a UI
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Evento de autenticação:', event, 'Sessão:', session);
        if (event === 'SIGNED_IN') {
            // Redireciona para o dashboard após login bem-sucedido
            // Apenas se a página atual não for já o dashboard para evitar loop
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
        } else if (event === 'SIGNED_OUT') {
            // Redireciona para a página de login após logout
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });

    // Ao carregar a página, verifica se o usuário já está logado
    // e redireciona para o dashboard se estiver.
    const { data: { user } } = await supabase.auth.getUser();
    if (user && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/')) {
        window.location.href = 'dashboard.html';
    }
});


/**
 * Lida com o processo de login do usuário.
 * @param {Event} event - O evento de submit do formulário.
 */
async function handleLogin(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value;
    const password = passwordInput.value;

    showLoading('Entrando...'); // Exibe mensagem de carregamento

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro de login:', error.message);
            // Chamada corrigida para showToast: tipo, título, mensagem
            showToast('error', 'Erro de Login', error.message);
            return;
        }

        // Login bem-sucedido, onAuthStateChange já cuidará do redirecionamento
        showToast('success', 'Sucesso!', 'Login realizado com sucesso!');
        // O redirecionamento para dashboard.html será tratado pelo onAuthStateChange

    } catch (err) {
        console.error('Erro inesperado durante o login:', err.message);
        showToast('error', 'Erro Inesperado', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
        hideLoading(); // Esconde mensagem de carregamento
    }
}

/**
 * Lida com o processo de registro de novo usuário.
 * @param {Event} event - O evento de submit do formulário.
 */
async function handleRegister(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value;
    const password = passwordInput.value;

    showLoading('Registrando...');

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            // options: {
            //     data: {
            //         // Campos adicionais que você pode querer salvar no perfil do usuário no Supabase
            //         // is_admin: false, // A coluna is_admin na tabela de usuários é tratada separadamente,
            //                            // geralmente não é definida no registro direto por segurança.
            //     }
            // }
        });

        if (error) {
            console.error('Erro de registro:', error.message);
            showToast('error', 'Erro de Registro', error.message);
            return;
        }

        // Se o registro for bem-sucedido, o Supabase envia um e-mail de confirmação.
        // O usuário precisará confirmar o e-mail antes de poder fazer login.
        showToast('success', 'Registro Efetuado', 'Registro bem-sucedido! Verifique seu e-mail para confirmar a conta.');
        // Limpar o formulário após o registro
        emailInput.value = '';
        passwordInput.value = '';

    } catch (err) {
        console.error('Erro inesperado durante o registro:', err.message);
        showToast('error', 'Erro Inesperado', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
        hideLoading();
    }
}

/**
 * Lida com o processo de recuperação de senha.
 * @param {Event} event - O evento de submit do formulário.
 */
async function handleForgotPassword(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const email = emailInput.value;

    showLoading('Enviando e-mail...');

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Você pode especificar uma URL de redirecionamento aqui
            // para onde o usuário será levado após clicar no link do e-mail.
            // Por exemplo: redirectTo: 'http://localhost:5000/reset_password.html'
            // O caminho precisa ser público e acessível.
            redirectTo: window.location.origin + '/reset_password.html' // Assumindo que você terá uma página reset_password.html
        });

        if (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error.message);
            showToast('error', 'Erro ao Enviar E-mail', error.message);
            return;
        }

        showToast('success', 'E-mail Enviado', 'E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        emailInput.value = '';

    } catch (err) {
        console.error('Erro inesperado durante a recuperação de senha:', err.message);
        showToast('error', 'Erro Inesperado', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
        hideLoading();
    }
}

// Funções de Logout (pode ser chamada de qualquer página logada, ex: dashboard)
export async function handleLogout() {
    showLoading('Saindo...');
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error.message);
            showToast('error', 'Erro ao Sair', 'Erro ao sair. Tente novamente.');
            return;
        }
        showToast('success', 'Sessão Encerrada', 'Logout realizado com sucesso.');
        // onAuthStateChange já cuidará do redirecionamento para index.html
    } catch (err) {
        console.error('Erro inesperado durante o logout:', err.message);
        showToast('error', 'Erro Inesperado', 'Ocorreu um erro inesperado durante o logout.');
    } finally {
        hideLoading();
    }
}
