// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Configuração CORRETA do Firebase para o projeto studio-57-so
const firebaseConfig = window.__firebase_config || {
    apiKey: "AIzaSyDqEZBDWm_ek2ktGJRf8G4C5QeObNdHl2g",
    authDomain: "studio-57-so.firebaseapp.com",
    projectId: "studio-57-so",
    storageBucket: "studio-57-so.appspot.com",
    messagingSenderId: "395916370396",
    appId: "1:395916370396:web:0718690a1af627f3d02f19"
};

// Inicializa a aplicação Firebase
const app = initializeApp(firebaseConfig);

// Define um ID específico para a coleção da sua aplicação dentro de 'artifacts'
const APP_COLLECTION_ID = "studio57App";

export { app, APP_COLLECTION_ID };