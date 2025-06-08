// auth.js
import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from './firebase-config.js'; // Importa a instância 'app'

const auth = getAuth(app);

// --- Lógica da Página de Login (index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm'); // ID do index.html antigo, agora é 'login-form-firebase' no index.html atualizado
    // Para compatibilidade com o index.html fornecido anteriormente, vamos usar o ID 'login-form-firebase'
    const actualLoginForm = document.getElementById('login-form-firebase') || loginForm; // Fallback para o ID antigo se necessário
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberEmailCheckbox = document.getElementById('rememberEmail'); // ID do index.html antigo, agora 'remember-email'
    const actualRememberEmailCheckbox = document.getElementById('remember-email') || rememberEmailCheckbox;
    const errorMessage = document.getElementById('error-message'); // ID do index.html antigo, agora 'error-message-new'
    const actualErrorMessage = document.getElementById('error-message-new') || errorMessage;


    if (actualLoginForm) {
        // Tenta carregar o e-mail salvo
        const savedEmail = localStorage.getItem('rememberedLoginEmail'); // Usando a constante do index.html mais recente: LS_REMEMBERED_EMAIL_KEY
        const rememberPreference = localStorage.getItem('rememberEmailPreference') === 'true'; // LS_REMEMBER_PREFERENCE_KEY

        if (rememberPreference && savedEmail && emailInput) {
            emailInput.value = savedEmail;
            if (actualRememberEmailCheckbox) actualRememberEmailCheckbox.checked = true;
        } else {
            if (actualRememberEmailCheckbox) actualRememberEmailCheckbox.checked = false;
        }

        actualLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(actualErrorMessage) actualErrorMessage.textContent = ''; // Limpa mensagens de erro anteriores
            if(actualErrorMessage) actualErrorMessage.classList.add('hidden');


            const email = emailInput.value;
            const password = passwordInput.value;


            if (actualRememberEmailCheckbox && actualRememberEmailCheckbox.checked) {
                localStorage.setItem('rememberedLoginEmail', email); // LS_REMEMBERED_EMAIL_KEY
                localStorage.setItem('rememberEmailPreference', 'true'); // LS_REMEMBER_PREFERENCE_KEY
            } else {
                localStorage.removeItem('rememberedLoginEmail'); // LS_REMEMBERED_EMAIL_KEY
                localStorage.removeItem('rememberEmailPreference'); // LS_REMEMBER_PREFERENCE_KEY
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'dashboard.html'; // Redireciona para dashboard
            } catch (error) {
                console.error("Erro de login:", error);
                let msg = "Erro desconhecido. Tente novamente.";
                switch (error.code) {
                    case 'auth/invalid-email':
                        msg = 'Formato de e-mail inválido.';
                        break;
                    case 'auth/user-disabled':
                        msg = 'Este usuário foi desativado.';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        msg = 'E-mail ou senha incorretos.';
                        break;
                    case 'auth/network-request-failed':
                        msg = 'Erro de conexão. Verifique sua internet.';
                        break;
                    default:
                        msg = `Erro: ${error.message}`;
                }
                if(actualErrorMessage) {
                    actualErrorMessage.textContent = msg;
                    actualErrorMessage.classList.remove('hidden');
                }
            }
        });
    }

    // --- Lógica da Página de Recuperação de Senha (forgot_password.html) ---
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetEmailInput = document.getElementById('reset-email');
    const resetMessage = document.getElementById('reset-message');

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = resetEmailInput.value;
            resetMessage.textContent = '';
            resetMessage.classList.remove('info-message', 'error-message'); // Limpa classes antigas

            try {
                await sendPasswordResetEmail(auth, email);
                resetMessage.className = 'info-message'; // Adiciona classe para sucesso
                resetMessage.textContent = 'Link de recuperação enviado para o seu e-mail. Verifique sua caixa de entrada.';
            } catch (error) {
                console.error("Erro ao enviar link de recuperação:", error);
                resetMessage.className = 'error-message'; // Adiciona classe para erro
                let msg = "Erro ao enviar link de recuperação. Tente novamente.";
                if (error.code === 'auth/invalid-email') {
                    msg = 'Formato de e-mail inválido.';
                } else if (error.code === 'auth/user-not-found') {
                    msg = 'Nenhum usuário encontrado com este e-mail.';
                }
                resetMessage.textContent = msg;
            }
            resetMessage.classList.remove('hidden'); // Garante que a mensagem seja exibida
        });
    }

    // --- Lógica da Página de Registro (register.html) ---
    const registerForm = document.getElementById('registerForm'); //
    const registerEmailInput = document.getElementById('register-email'); //
    const registerPasswordInput = document.getElementById('register-password'); //
    const registerConfirmPasswordInput = document.getElementById('register-confirm-password'); // NOVO: Pega o campo de confirmar senha
    const registerMessage = document.getElementById('register-message'); //

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            const confirmPassword = registerConfirmPasswordInput.value; // NOVO: Pega o valor da confirmação de senha
            
            registerMessage.textContent = '';
            registerMessage.classList.remove('info-message', 'error-message'); // Limpa classes antigas
            registerMessage.classList.add('hidden'); // Esconde a mensagem inicialmente

            // NOVO: Verifica se as senhas coincidem
            if (password !== confirmPassword) {
                registerMessage.className = 'error-message';
                registerMessage.textContent = 'As senhas não coincidem. Por favor, tente novamente.';
                registerMessage.classList.remove('hidden');
                return; // Interrompe o processo de registro
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                registerMessage.className = 'info-message';
                registerMessage.textContent = 'Conta criada com sucesso! Redirecionando para o login...';
                registerMessage.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000); // Redireciona após 2 segundos
            } catch (error) {
                console.error("Erro ao registrar usuário:", error);
                registerMessage.className = 'error-message';
                let msg = "Erro ao registrar. Tente novamente.";
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        msg = 'Este e-mail já está em uso.';
                        break;
                    case 'auth/invalid-email':
                        msg = 'Formato de e-mail inválido.';
                        break;
                    case 'auth/weak-password':
                        msg = 'A senha deve ter pelo menos 6 caracteres.';
                        break;
                    default:
                        msg = `Erro: ${error.message}`;
                }
                registerMessage.textContent = msg;
                registerMessage.classList.remove('hidden');
            }
        });
    }
});