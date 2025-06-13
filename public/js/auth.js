// public/js/auth.js (CORRIGIDO PARA USAR FIREBASE)
import { app } from './firebase-config.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(app);

// --- LÓGICA DE LOGIN ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Redireciona se já estiver logado
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginButton = document.getElementById('loginButton');
        const errorMessage = document.getElementById('error-message');
        const spinner = loginButton.querySelector('.spinner-overlay-button');

        loginButton.disabled = true;
        spinner.style.display = 'flex';
        errorMessage.style.display = 'none';

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login bem-sucedido
                console.log('Login bem-sucedido:', userCredential.user);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error('Erro no login:', error.code, error.message);
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage.textContent = 'E-mail ou senha inválidos. Tente novamente.';
                } else {
                    errorMessage.textContent = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
                }
                errorMessage.style.display = 'block';
            })
            .finally(() => {
                loginButton.disabled = false;
                spinner.style.display = 'none';
            });
    });
}

// --- LÓGICA DE CADASTRO ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
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

        registerButton.disabled = true;
        spinner.style.display = 'flex';

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('Cadastro bem-sucedido:', userCredential.user);
                registerForm.style.display = 'none';
                successMessage.innerHTML = 'Cadastro realizado com sucesso! Você já pode voltar para a tela de login e entrar no sistema.';
                successMessage.style.display = 'block';
            })
            .catch((error) => {
                console.error('Erro no cadastro:', error.code, error.message);
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage.textContent = 'Este e-mail já está cadastrado.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage.textContent = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                } else {
                    errorMessage.textContent = 'Ocorreu um erro ao criar a conta.';
                }
                errorMessage.style.display = 'block';
            })
            .finally(() => {
                registerButton.disabled = false;
                spinner.style.display = 'none';
            });
    });
}

// --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value;
        const messageDiv = document.getElementById('reset-message');
        
        sendPasswordResetEmail(auth, email)
            .then(() => {
                messageDiv.textContent = 'Sucesso! Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
                messageDiv.className = 'mt-4 text-center text-green-700';
            })
            .catch((error) => {
                console.error('Erro ao enviar e-mail de recuperação:', error);
                // Não informamos o erro para o usuário por segurança
                messageDiv.textContent = 'Sucesso! Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
                messageDiv.className = 'mt-4 text-center text-green-700';
            });
    });
}