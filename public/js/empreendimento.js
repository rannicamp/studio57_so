// public/js/empreendimento.js

import { supabaseClient as supabase } from './supabase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

let currentEditId = null; // Para futura funcionalidade de edição, caso implementada.

// Variáveis e elementos do DOM que serão usados
const empreendimentoForm = document.getElementById('empreendimentoForm');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelFormBtn');
const cepInput = document.getElementById('cep');
const addPavementBtn = document.getElementById('add-pavement-btn');
const areaTableBody = document.getElementById('area-table-body');
// Nota: as abas agora são controladas diretamente no initializePage() de registro_empreendimento.html

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
    // Como não há um elemento específico para isso no HTML, apenas calculamos.
}

// Event listener para ações dentro do quadro de áreas (mover/excluir)
if (areaTableBody) {
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
}


// Event listener para o botão de adicionar pavimento
if (addPavementBtn) {
    addPavementBtn.addEventListener('click', () => createAreaRow());
}


// --- FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO DO MÓDULO ---
// Esta função é chamada pelo registro_empreendimento.html após a autenticação
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
    // O botão 'saveBtn' tem type="submit" no HTML, então ele dispara o submit do form
    // Não precisa de um listener extra aqui, a menos que haja lógica pré-submit
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os campos?')) {
                empreendimentoForm.reset();
                areaTableBody.innerHTML = ''; // Limpa a tabela de áreas
                createAreaRow('Térreo'); // Adiciona a linha inicial de volta
                // Como as abas agora são controladas no initializePage() do HTML,
                // apenas garantimos que a primeira aba seja reativada visualmente se necessário.
                document.querySelector('.tab[data-tab="geral"]')?.click();
            }
        });
    }

    // Inicializa o quadro de áreas com uma linha padrão se o elemento existir
    if (areaTableBody) {
        areaTableBody.innerHTML = ''; // Garante que esteja limpo antes de adicionar
        createAreaRow('Térreo');
        calculateTotalArea(); // Calcula a área inicial
    }
}


// --- FUNÇÃO DE ENVIO DO FORMULÁRIO PARA SUPABASE ---
async function handleFormSubmit(e) {
    e.preventDefault();
    showLoading();

    // Desabilita o botão para evitar múltiplos envios
    if (saveBtn) {
        saveBtn.disabled = true;
    }

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
        
        // Limpa e reinicializa o quadro de áreas
        if (areaTableBody) {
            areaTableBody.innerHTML = '';
            createAreaRow('Térreo');
            calculateTotalArea();
        }
        
        // Ativa a primeira aba novamente
        document.querySelector('.tab[data-tab="geral"]')?.click();
        
    } catch (error) {
        console.error("Erro ao salvar empreendimento:", error);
        showToast('error', 'Erro ao Salvar', 'Não foi possível cadastrar o empreendimento.');
    } finally {
        hideLoading();
        if (saveBtn) {
            saveBtn.disabled = false; // Garante que o botão de salvar seja reativado
        }
    }
}

// Não há mais a chamada initializePage() aqui.
// Ela agora está no registro_empreendimento.html e é responsável
// por chamar initializeEmpreendimentoModule() no momento certo.