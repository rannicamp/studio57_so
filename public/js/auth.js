// public/js/auth.js
import { supabaseClient as supabase } from './supabase-config.js';
import { checkAuthAndRedirect } from './common.js';

// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginButton = document.getElementById('loginButton');
        const errorMessage = document.getElementById('error-message');
        const spinner = loginButton.querySelector('.spinner-overlay-button');

        loginButton.disabled = true;
        spinner.style.display = 'flex';
        errorMessage.style.display = 'none';

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro no login:', error.message);
            errorMessage.textContent = 'E-mail ou senha inválidos. Tente novamente.';
            errorMessage.style.display = 'block';
        } else {
            console.log('Login bem-sucedido:', data.user);
            window.location.href = 'dashboard.html';
        }

        loginButton.disabled = false;
        spinner.style.display = 'none';
    });
}

// --- LÓGICA DE CADASTRO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const registerButton = document.getElementById('registerButton');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        const spinner = registerButton.querySelector('.spinner-overlay-button');
        
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        if (password !== confirmPassword) {
            errorMessage.textContent = 'As senhas não coincidem.';
            errorMessage.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            errorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            errorMessage.style.display = 'block';
            return;
        }

        registerButton.disabled = true;
        spinner.style.display = 'flex';

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Erro no cadastro:', error.message);
            if (error.message.includes("User already registered")) {
                errorMessage.textContent = 'Este e-mail já está cadastrado.';
            } else {
                errorMessage.textContent = 'Ocorreu um erro ao criar a conta.';
            }
            errorMessage.style.display = 'block';
        } else {
            console.log('Cadastro bem-sucedido:', data.user);
            registerForm.style.display = 'none';
            successMessage.innerHTML = 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmação e depois <a href="index.html">clique aqui para fazer login</a>.';
            successMessage.style.display = 'block';
        }

        registerButton.disabled = false;
        spinner.style.display = 'none';
    });
}

// --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value;
        const messageDiv = document.getElementById('reset-message');
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/index.html`, // Link para onde o usuário será levado após redefinir
        });

        if (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
        }
        
        // Por segurança, sempre mostramos a mesma mensagem de sucesso.
        messageDiv.textContent = 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
    });
}

// --- CHECAGEM INICIAL ---
// Esta função será executada em todas as páginas que importam auth.js
checkAuthAndRedirect();