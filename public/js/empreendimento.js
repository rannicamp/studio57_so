// public/js/empreendimento.js

import { supabaseClient as supabase } from './supabase-config.js';
import { checkAuthAndRedirect, initializeCommonUI, loadHTMLComponent, initializeSidebarToggle, showLoading, hideLoading, showToast } from './common.js';

let currentEditId = null; // Para futura funcionalidade de edição, caso implementada.

// Variáveis e elementos do DOM que serão usados
const empreendimentoForm = document.getElementById('empreendimentoForm');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelFormBtn');
const cepInput = document.getElementById('cep');
const addPavementBtn = document.getElementById('add-pavement-btn');
const areaTableBody = document.getElementById('area-table-body');
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.form-section');

// Mapeamento dos IDs dos campos estáticos para facilitar a coleta de dados
const fieldIds = [
    "nomeEmpreendimento", "usoImovel", "descricaoProjeto",
    "cep", "logradouro", "numero", "bairro", "cidade", "estado",
    "lote", "quadra", "zona", "via", "areaTerreno",
    "proprietarioNome", "proprietarioCpfCnpj", "responsavelTecnicoNome", "cauCrea",
    "numPavimentos", "coefAproveitamento", "taxaPermeabilidade", "unidadesResidenciais",
    "unidadesNaoResidenciais", "vagasEstacionamento", "observacoesEdificacao",
    "statusAprovacao", "dataAprovacao", "numProcesso", "responsavelAprovacao"
];

// --- LÓGICA DAS MÁSCARAS ---
function applyCepMask(e) {
    e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
}

// --- LÓGICA DA BUSCA DE CEP ---
async function fetchAddressFromCEP(cepValue) {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
        return; // Sai se o CEP não tiver 8 dígitos
    }

    showLoading();
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) {
            throw new Error('Falha na resposta da API');
        }
        
        const data = await response.json();
        if (data.erro) {
            showToast('warning', 'CEP não encontrado', 'Verifique o CEP digitado e tente novamente.');
            // Limpa os campos se o CEP não for encontrado
            document.getElementById('logradouro').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('estado').value = '';
        } else {
            // Preenche os campos de endereço
            document.getElementById('logradouro').value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            document.getElementById('numero').focus(); // Coloca o cursor no campo de número
        }
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showToast('error', 'Erro na Busca', 'Não foi possível buscar o endereço. Tente preencher manualmente.');
    } finally {
        hideLoading();
    }
}

// --- LÓGICA DA TABELA DE ÁREAS (Quadro de Pavimentos) ---
function createAreaRow(pavimento = '', area = '') {
    const row = document.createElement('div');
    row.className = 'area-table-row';
    row.innerHTML = `
        <div class="area-table-cell">
            <input type="text" class="form-control pavement-name" placeholder="Ex: Térreo" value="${pavimento}">
        </div>
        <div class="area-table-cell">
            <input type="number" class="form-control pavement-area" placeholder="0.00" step="0.01" value="${area}">
        </div>
        <div class="area-table-cell area-table-actions">
            <button type="button" class="btn-action move-up" title="Mover para Cima"><i class="fas fa-arrow-up"></i></button>
            <button type="button" class="btn-action move-down" title="Mover para Baixo"><i class="fas fa-arrow-down"></i></button>
            <button type="button" class="btn-action delete" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
    `;
    areaTableBody.appendChild(row);

    // Adiciona o listener de input para recalcular a área total quando um valor é alterado
    row.querySelector('.pavement-area').addEventListener('input', calculateTotalArea);
}

function calculateTotalArea() {
    let total = 0;
    areaTableBody.querySelectorAll('.pavement-area').forEach(input => {
        const area = parseFloat(input.value);
        if (!isNaN(area)) {
            total += area;
        }
    });
    // Aqui você pode atualizar um elemento no HTML para mostrar a área total
    // Ex: document.getElementById('totalAreaDisplay').textContent = total.toFixed(2);
    // Como não há um elemento específico para isso no HTML que me foi fornecido,
    // apenas calculamos e, se precisar, você pode exibir depois.
}

// Event listener para ações dentro do quadro de áreas (mover/excluir)
areaTableBody.addEventListener('click', (e) => {
    const target = e.target.closest('.btn-action');
    if (!target) return;

    const row = target.closest('.area-table-row');

    if (target.classList.contains('delete')) {
        if (confirm('Tem certeza que deseja excluir este pavimento?')) {
            row.remove();
            calculateTotalArea(); // Recalcula a área total após a exclusão
        }
    } else if (target.classList.contains('move-up')) {
        const prevRow = row.previousElementSibling;
        if (prevRow) {
            areaTableBody.insertBefore(row, prevRow);
        }
    } else if (target.classList.contains('move-down')) {
        const nextRow = row.nextElementSibling;
        if (nextRow) {
            areaTableBody.insertBefore(nextRow, row);
        }
    }
});

// Event listener para o botão de adicionar pavimento
addPavementBtn.addEventListener('click', () => createAreaRow());

// --- LÓGICA DAS ABAS (Tabs) ---
function setupTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabTarget = tab.dataset.tab;
            sections.forEach(section => {
                section.classList.toggle('active', section.dataset.tabContent === tabTarget);
            });
        });
    });

    // Ativa a primeira aba ao carregar a página
    if (tabs.length > 0) {
        tabs[0].click(); 
    }
}


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO DO MÓDULO ---
export function initializeEmpreendimentoModule() {
    // Adiciona Listeners de Máscaras e CEP
    if (cepInput) {
        cepInput.addEventListener('input', applyCepMask);
        cepInput.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));
    }

    // Configura os listeners dos botões do formulário
    if (empreendimentoForm) {
        empreendimentoForm.addEventListener('submit', handleFormSubmit);
    }
    if (saveBtn) {
        // O listener de submit já está no formulário, este botão apenas dispara
        // garantimos que o type="submit" no HTML está correto
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os campos?')) {
                empreendimentoForm.reset();
                areaTableBody.innerHTML = ''; // Limpa a tabela de áreas
                createAreaRow('Térreo'); // Adiciona a linha inicial de volta
                setupTabs(); // Volta para a primeira aba
            }
        });
    }

    // Inicializa o quadro de áreas com uma linha padrão
    createAreaRow('Térreo');
    calculateTotalArea(); // Calcula a área inicial

    // Configura as abas
    setupTabs();
}

// --- FUNÇÃO DE ENVIO DO FORMULÁRIO PARA SUPABASE ---
async function handleFormSubmit(e) {
    e.preventDefault();
    showLoading();

    // Coleta dados dos campos estáticos
    const empreendimentoData = {};
    fieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const value = element.value;
            if (element.type === 'number') {
                empreendimentoData[id] = value ? Number(value) : null;
            } else if(element.type === 'date') {
                empreendimentoData[id] = value || null;
            } else {
                empreendimentoData[id] = value;
            }
        }
    });

    // Coleta dados da tabela de áreas dinâmica
    const quadroDeAreas = [];
    const areaRows = areaTableBody.querySelectorAll('.area-table-row');
    areaRows.forEach(row => {
        const nome = row.querySelector('.pavement-name').value;
        const area = row.querySelector('.pavement-area').value;
        if (nome && area) { // Salva apenas se ambos os campos estiverem preenchidos
            quadroDeAreas.push({ pavimento: nome, area: Number(area) });
        }
    });
    empreendimentoData.quadroDeAreas = quadroDeAreas;

    try {
        // Usa o Supabase para inserir dados na tabela 'empreendimentos'
        const { data, error } = await supabase
            .from('empreendimentos')
            .insert([empreendimentoData])
            .select(); // Adiciona .select() para obter os dados do registro inserido

        if (error) {
            throw error;
        }

        showToast('success', 'Sucesso!', 'Empreendimento cadastrado com sucesso.');
        empreendimentoForm.reset(); // Limpa o formulário após o sucesso
        areaTableBody.innerHTML = ''; // Limpa a tabela de áreas
        createAreaRow('Térreo'); // Adiciona a linha inicial de volta
        setupTabs(); // Volta para a primeira aba
        
    } catch (error) {
        console.error("Erro ao salvar empreendimento:", error);
        showToast('error', 'Erro ao Salvar', 'Não foi possível cadastrar o empreendimento.');
    } finally {
        hideLoading();
        saveBtn.disabled = false; // Garante que o botão de salvar seja reativado
    }
}


// --- INICIALIZAÇÃO DA PÁGINA (CHAMADA PRINCIPAL) ---
// Esta função será chamada pelo <script type="module"> no HTML da página
// Ela garante que a sidebar, informações do usuário e as funções do módulo sejam ativadas
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega a sidebar primeiro
    await loadHTMLComponent('sidebar-placeholder', 'sidebar.html');

    // Verifica a autenticação e, se autenticado, inicializa a UI e o módulo de empreendimento
    // O checkAuthAndRedirect já lida com o redirecionamento se não estiver logado
    checkAuthAndRedirect((user) => {
        initializeCommonUI(user); // Inicializa a data, hora e info do usuário no cabeçalho
        initializeSidebarToggle(); // Configura o botão de recolher/expandir a sidebar
        initializeEmpreendimentoModule(); // Inicializa o módulo específico desta página
    });
});