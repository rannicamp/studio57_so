// public/js/auth.js

import { supabaseClient } from './supabase-config.js'; // Importa o cliente Supabase

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do formulário

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            errorMessage.style.display = 'none'; // Esconde a mensagem de erro anterior

            try {
                // Tenta fazer o login com o Supabase
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    // Se houver um erro, exibe a mensagem apropriada
                    console.error('Erro de login:', error.message);
                    errorMessage.textContent = 'Erro ao fazer login. Verifique seu email e senha.';
                    errorMessage.style.display = 'block';
                } else {
                    // Se o login for bem-sucedido, redireciona para o dashboard
                    console.log('Login bem-sucedido!', data);
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Erro inesperado:', err);
                errorMessage.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
                errorMessage.style.display = 'block';
            }
        });
    }

    // Função para verificar o status de login ao carregar a página
    async function checkLoginStatus() {
        // Verifica se há uma sessão ativa do Supabase
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (session) {
            // Se houver sessão, redireciona para o dashboard se estiver na página de login
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Se não houver sessão, redireciona para o login se não estiver na página de login, registro ou esqueceu a senha
            const publicPages = ['index.html', 'register.html', 'forgot_password.html'];
            const currentPage = window.location.pathname.split('/').pop();
            if (!publicPages.includes(currentPage) && currentPage !== '') {
                window.location.href = 'index.html';
            }
        }
    }

    // Chama a função para verificar o status de login ao carregar a página
    checkLoginStatus();
});