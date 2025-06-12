import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from './firebase-config.js'; 

const auth = getAuth(app);

// Nova lógica de login com Firebase
const actualLoginForm = document.getElementById('login-form-firebase');
if (actualLoginForm) {
    actualLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessageDiv = document.getElementById('error-message-new');

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Usuário logado:', user);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                console.error('Erro de login:', error.code, error.message);
                let msg = 'E-mail ou senha incorretos. Tente novamente.';
                if (error.code === 'auth/network-request-failed') {
                    msg = 'Erro de conexão. Verifique sua internet.';
                }
                errorMessageDiv.textContent = msg;
                errorMessageDiv.style.display = 'block';
            });
    });
}

// Lógica para a página de recuperação de senha
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        const messageDiv = document.getElementById('reset-message');

        sendPasswordResetEmail(auth, email)
            .then(() => {
                messageDiv.textContent = 'E-mail de redefinição de senha enviado com sucesso!';
                messageDiv.style.color = 'green';
                messageDiv.style.display = 'block';
            })
            .catch((error) => {
                console.error('Erro ao enviar e-mail de redefinição:', error);
                messageDiv.textContent = 'Erro ao enviar e-mail. Verifique o endereço e tente novamente.';
                messageDiv.style.color = 'red';
                messageDiv.style.display = 'block';
            });
    });
}

// Lógica para a página de registro
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
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

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                messageDiv.textContent = 'Usuário registrado com sucesso! Redirecionando para o login...';
                messageDiv.style.color = 'green';
                setTimeout(() => window.location.href = 'index.html', 3000);
            })
            .catch((error) => {
                console.error('Erro de registro:', error);
                messageDiv.textContent = `Erro no registro: ${error.message}`;
                messageDiv.style.color = 'red';
            });
    });
}