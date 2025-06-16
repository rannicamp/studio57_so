// public/js/auth.js

// Importa o cliente supabase que criamos no arquivo de configuração.
import { supabase } from './supabase-config.js';

// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('login-form-firebase');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessageDiv = document.getElementById('error-message-new');
        errorMessageDiv.style.display = 'none'; // Esconde a mensagem de erro anterior

        // Tenta fazer o login com o Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // Se o Supabase retornar um erro, mostra uma mensagem
            console.error('Erro de login:', error.message);
            errorMessageDiv.textContent = 'E-mail ou senha incorretos. Tente novamente.';
            errorMessageDiv.style.display = 'block';
        } else {
            // Se o login for bem-sucedido, redireciona para o dashboard
            console.log('Usuário logado:', data.user);
            window.location.href = 'dashboard.html';
        }
    });
}

// --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        const messageDiv = document.getElementById('reset-message');

        // Pede ao Supabase para enviar o e-mail de recuperação
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Opcional: para onde redirecionar após a troca de senha
        });

        if (error) {
            console.error('Erro ao enviar e-mail de redefinição:', error);
            messageDiv.textContent = 'Erro ao enviar e-mail. Verifique o endereço e tente novamente.';
            messageDiv.style.color = 'red';
        } else {
            messageDiv.textContent = 'Se o e-mail estiver cadastrado, um link de recuperação foi enviado!';
            messageDiv.style.color = 'green';
        }
        messageDiv.style.display = 'block';
    });
}

// --- LÓGICA DE REGISTRO DE NOVO USUÁRIO ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const messageDiv = document.getElementById('register-message');

        if (password !== confirmPassword) {
            messageDiv.textContent = 'As senhas não coincidem.';
            messageDiv.style.color = 'red';
            return;
        }

        // Tenta registrar um novo usuário no Supabase
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro de registro:', error);
            messageDiv.textContent = `Erro no registro: ${error.message}`;
            messageDiv.style.color = 'red';
        } else {
            messageDiv.textContent = 'Usuário registrado com sucesso! Verifique seu e-mail para confirmação e depois faça o login.';
            messageDiv.style.color = 'green';
             // Não redireciona mais automaticamente, o usuário precisa confirmar o e-mail primeiro.
        }
    });
}