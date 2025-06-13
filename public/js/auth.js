import { supabase } from './supabase-config.js';

// --- ELEMENTOS DO DOM ---
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- LÓGICA DE LOGIN ---
// Este bloco só executa se o formulário de login for encontrado na página
if (loginForm) {
    const loginButton = document.getElementById('loginButton');
    const errorMessageDiv = document.getElementById('error-message');
    const spinner = loginButton.querySelector('.spinner-overlay-button');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        spinner.style.display = 'flex';
        loginButton.disabled = true;
        errorMessageDiv.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        spinner.style.display = 'none';
        loginButton.disabled = false;

        if (error) {
            console.error('Erro no login:', error.message);
            errorMessageDiv.textContent = 'Email ou senha inválidos. Tente novamente.';
            errorMessageDiv.style.display = 'block';
        } else {
            console.log('Login bem-sucedido:', data);
            window.location.href = 'dashboard.html';
        }
    });
}

// --- LÓGICA DE CADASTRO ---
// Este bloco só executa se o formulário de cadastro for encontrado na página
if (registerForm) {
    const registerButton = document.getElementById('registerButton');
    const successMessageDiv = document.getElementById('success-message');
    const errorMessageDiv = document.getElementById('error-message');
    const spinner = registerButton.querySelector('.spinner-overlay-button');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        spinner.style.display = 'flex';
        registerButton.disabled = true;
        errorMessageDiv.style.display = 'none';
        successMessageDiv.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            errorMessageDiv.textContent = 'As senhas não coincidem.';
            errorMessageDiv.style.display = 'block';
            spinner.style.display = 'none';
            registerButton.disabled = false;
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        spinner.style.display = 'none';
        registerButton.disabled = false;

        if (error) {
            console.error('Erro no cadastro:', error.message);
            if (error.message.includes("User already registered")) {
                errorMessageDiv.textContent = 'Este e-mail já está cadastrado.';
            } else if (error.message.includes("Password should be at least 6 characters")) {
                 errorMessageDiv.textContent = 'A senha deve ter no mínimo 6 caracteres.';
            } else {
                errorMessageDiv.textContent = 'Ocorreu um erro ao criar a conta.';
            }
            errorMessageDiv.style.display = 'block';
        } else {
            console.log('Cadastro bem-sucedido:', data);
            registerForm.style.display = 'none';
            successMessageDiv.innerHTML = 'Cadastro realizado com sucesso!<br><strong>Importante:</strong> Verifique seu e-mail para confirmar sua conta antes de fazer o login.';
            successMessageDiv.style.display = 'block';
        }
    });
}