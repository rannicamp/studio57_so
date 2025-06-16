// public/js/auth.js

import { supabaseClient as supabase } from './supabase-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from './common.js';

// Função para exibir o spinner no botão
const toggleButtonSpinner = (button, show) => {
    if (!button) return;
    const spinner = button.querySelector('.spinner-overlay-button');
    const buttonText = button.querySelector('span');
    if (show) {
        if (spinner) spinner.style.display = 'flex';
        if (buttonText) buttonText.style.visibility = 'hidden';
        button.disabled = true;
    } else {
        if (spinner) spinner.style.display = 'none';
        if (buttonText) buttonText.style.visibility = 'visible';
        button.disabled = false;
    }
};

// --- LÓGICA DE LOGIN ---
const handleLogin = async (form, button) => {
    const email = form.email.value;
    const password = form.password.value;

    toggleButtonSpinner(button, true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    toggleButtonSpinner(button, false);

    if (error) {
        showToast('error', 'Falha no Login', 'Email ou senha inválidos. Verifique seus dados.');
        console.error('Erro de login:', error.message);
    } else {
        showToast('success', 'Sucesso!', 'Login realizado. Redirecionando...');
        window.location.href = 'dashboard.html';
    }
};

// --- LÓGICA DE REGISTRO ---
const handleRegister = async (form, button) => {
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password.length < 6) {
        showToast('error', 'Senha Fraca', 'A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    if (password !== confirmPassword) {
        showToast('error', 'Senhas Diferentes', 'As senhas não correspondem.');
        return;
    }

    toggleButtonSpinner(button, true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    toggleButtonSpinner(button, false);

    if (error) {
        showToast('error', 'Erro no Cadastro', 'Não foi possível criar a conta. O e-mail pode já estar em uso.');
        console.error('Erro no cadastro:', error.message);
    } else {
        const successMessage = document.getElementById('success-message');
        if(successMessage) {
            successMessage.textContent = 'Cadastro realizado com sucesso! Um e-mail de confirmação foi enviado. Por favor, verifique sua caixa de entrada para ativar sua conta.';
            successMessage.style.display = 'block';
        }
        form.style.display = 'none'; // Esconde o formulário
    }
};

// --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
const handlePasswordReset = async (form, button) => {
    const email = form['reset-email'].value;
    
    toggleButtonSpinner(button, true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://studio-57-so.web.app/password-reset.html', // URL para onde o usuário será levado após clicar no link
    });

    toggleButtonSpinner(button, false);
    
    const messageDiv = document.getElementById('reset-message');
    if (error) {
        messageDiv.textContent = 'Ocorreu um erro ao tentar enviar o e-mail. Verifique o endereço digitado.';
        messageDiv.className = 'error-message';
        console.error('Erro ao resetar senha:', error.message);
    } else {
        messageDiv.textContent = 'Se um usuário com este e-mail existir, um link de recuperação foi enviado. Verifique sua caixa de entrada.';
        messageDiv.className = 'message success';
    }
    messageDiv.style.display = 'block';
    form.style.display = 'none';
};


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Verifica a autenticação em todas as páginas
    checkAuthAndRedirect();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin(loginForm, loginForm.querySelector('button[type="submit"]'));
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleRegister(registerForm, document.getElementById('registerButton'));
        });
    }

    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePasswordReset(resetPasswordForm, resetPasswordForm.querySelector('button[type="submit"]'));
        });
    }
});