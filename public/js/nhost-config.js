// public/js/nhost-config.js

// Importa o cliente Nhost
import { NhostClient } from 'https://cdn.jsdelivr.net/npm/@nhost/nhost-js@2.3.0/dist/index.mjs'; // Usando uma versão recente, verifique a documentação Nhost se quiser a última

// Inicializa o cliente Nhost com a URL do seu backend
const nhost = new NhostClient({
  backendUrl: 'https://nippontnjbvnmdfvpmq.nhost.app', // <--- SUA URL NHOST AQUI!
});

// Exporta as partes do cliente Nhost que você vai usar
export const nhostAuth = nhost.auth;
export const nhostStorage = nhost.storage;
// Você pode exportar outras partes se precisar, como nhost.graphql, nhost.functions, etc.