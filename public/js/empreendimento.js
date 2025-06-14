// public/js/empreendimento.js

import { supabaseClient as supabase } from './supabase-config.js'; // Importa o cliente Supabase
import { showLoading, hideLoading, showToast } from './common.js'; // Funções comuns para feedback visual

let currentEditId = null; // Para futura funcionalidade de edição, se houver.
let pavimentoCount = 0; // Inicia com 0 pavimentos, o JS adicionará o primeiro

export function initializeEmpreendimentoModule() {
    const empreendimentoForm = document.getElementById('empreendimentoForm');
    const cepInput = document.getElementById('cep');
    const addPavementBtn = document.getElementById('add-pavement-btn');
    const areaTableBody = document.getElementById('area-table-body');
    const cancelFormBtn = document.getElementById('cancelFormBtn');
    const saveBtn = document.getElementById('saveBtn'); // O botão de salvar no rodapé

    // 1. Listeners para os campos de Endereço (CEP)
    if (cepInput) {
        cepInput.addEventListener('input', applyCepMask);
        cepInput.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));
    }

    // 2. Listener para o formulário principal
    if (empreendimentoForm) {
        empreendimentoForm.addEventListener('submit', handleFormSubmit);
    }

    // 3. Listener para o botão "Adicionar Pavimento"
    if (addPavementBtn) {
        addPavementBtn.addEventListener('click', addPavementRow);
    }

    // 4. Listener para o botão "Limpar"
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            empreendimentoForm.reset(); // Reseta o formulário
            clearAllPavementRows(); // Limpa as linhas de pavimento dinâmicas
            addPavementRow(); // Adiciona a primeira linha de pavimento novamente
            showToast('info', 'Formulário Limpo', 'O formulário foi resetado.');
        });
    }

    // A função 'saveBtn' está vinculada ao submit do formulário pelo atributo 'form="empreendimentoForm"' no HTML
    // Não precisamos adicionar um listener de click específico aqui, pois o 'submit' do formulário já é capturado.


    // Funções Auxiliares ========================================================

    function applyCepMask(e) {
        e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
    }

    async function fetchAddressFromCEP(cepValue) {
        const cleanCep = cepValue.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            return;
        }

        showLoading();
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (!response.ok) {
                throw new Error('Falha na resposta da API ViaCEP');
            }
            const data = await response.json();
            if (data.erro) {
                showToast('warning', 'CEP não encontrado', 'Verifique o CEP digitado e tente novamente.');
            } else {
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
                document.getElementById('numero').focus();
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            showToast('error', 'Erro na Busca', 'Não foi possível buscar o endereço. Tente preencher manualmente.');
        } finally {
            hideLoading();
        }
    }

    // Funções de Gerenciamento de Pavimentos =====================================

    function addPavementRow() {
        pavimentoCount++;
        const row = document.createElement('div');
        row.classList.add('area-table-row');
        row.dataset.pavimentoId = pavimentoCount; // ID para referência

        row.innerHTML = `
            <div class="area-table-cell">
                <input type="text" class="form-control pavement-name-input" placeholder="Ex: Térreo, 1º Andar" value="Pavimento ${pavimentoCount}">
            </div>
            <div class="area-table-cell">
                <input type="number" class="form-control pavement-area-input" step="0.01" placeholder="0.00">
            </div>
            <div class="area-table-cell area-actions">
                <button type="button" class="btn btn-danger-icon remove-pavement-btn" title="Remover Pavimento">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        areaTableBody.appendChild(row);

        // Adiciona listener para o botão de remover recém-criado
        const removeBtn = row.querySelector('.remove-pavement-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removePavementRow(row));
        }
    }

    function removePavementRow(rowElement) {
        if (areaTableBody.children.length > 1) { // Garante que pelo menos uma linha permaneça
            rowElement.remove();
            showToast('info', 'Pavimento Removido', 'Um pavimento foi removido da lista.');
        } else {
            showToast('warning', 'Atenção', 'Pelo menos um pavimento deve permanecer.');
        }
    }

    function clearAllPavementRows() {
        areaTableBody.innerHTML = ''; // Limpa todas as linhas
        pavimentoCount = 0; // Reseta o contador
    }

    function getPavementData() {
        const pavementRows = areaTableBody.querySelectorAll('.area-table-row');
        const pavements = [];
        pavementRows.forEach(row => {
            const nameInput = row.querySelector('.pavement-name-input');
            const areaInput = row.querySelector('.pavement-area-input');
            if (nameInput && areaInput) {
                pavements.push({
                    nome: nameInput.value,
                    area: parseFloat(areaInput.value) || 0
                });
            }
        });
        return pavements;
    }


    // Função Principal de Envio (Adaptação para Supabase) ======================

    async function handleFormSubmit(e) {
        e.preventDefault();
        showLoading();

        const empreendimentoData = {
            nomeEmpreendimento: document.getElementById('nomeEmpreendimento').value,
            usoImovel: document.getElementById('usoImovel').value,
            descricaoProjeto: document.getElementById('descricaoProjeto').value,
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            lote: document.getElementById('lote').value,
            quadra: document.getElementById('quadra').value,
            zona: document.getElementById('zona').value,
            via: document.getElementById('via').value,
            areaTerreno: parseFloat(document.getElementById('areaTerreno').value) || null,
            proprietarioNome: document.getElementById('proprietarioNome').value,
            proprietarioCpfCnpj: document.getElementById('proprietarioCpfCnpj').value,
            responsavelTecnicoNome: document.getElementById('responsavelTecnicoNome').value,
            cauCrea: document.getElementById('cauCrea').value,
            // Dados da Edificação
            numPavimentos: parseInt(document.getElementById('numPavimentos').value) || null,
            coefAproveitamento: parseFloat(document.getElementById('coefAproveitamento').value) || null,
            taxaPermeabilidade: parseFloat(document.getElementById('taxaPermeabilidade').value) || null,
            unidadesResidenciais: parseInt(document.getElementById('unidadesResidenciais').value) || null,
            unidadesNaoResidenciais: parseInt(document.getElementById('unidadesNaoResidenciais').value) || null,
            vagasEstacionamento: parseInt(document.getElementById('vagasEstacionamento').value) || null,
            observacoesEdificacao: document.getElementById('observacoesEdificacao').value,
            // Dados de Aprovação
            statusAprovacao: document.getElementById('statusAprovacao').value,
            dataAprovacao: document.getElementById('dataAprovacao').value, // Formato YYYY-MM-DD
            numProcesso: document.getElementById('numProcesso').value,
            responsavelAprovacao: document.getElementById('responsavelAprovacao').value,
            // Quadro de Áreas/Pavimentos
            quadroAreas: getPavementData() // Coleta os dados dos pavimentos
        };

        // Validação básica para o nome do empreendimento e nome do proprietário
        if (!empreendimentoData.nomeEmpreendimento || !empreendimentoData.proprietarioNome) {
            hideLoading();
            showToast('error', 'Campos Obrigatórios', 'Nome do Empreendimento e Nome do Proprietário são obrigatórios.');
            return;
        }

        try {
            // Insere os dados na tabela 'empreendimentos' no Supabase
            const { data, error } = await supabase
                .from('empreendimentos')
                .insert([empreendimentoData])
                .select(); // Adiciona .select() para obter os dados do registro inserido

            if (error) {
                throw error;
            }

            showToast('success', 'Sucesso!', 'Empreendimento cadastrado com sucesso.');
            empreendimentoForm.reset(); // Limpa o formulário
            clearAllPavementRows(); // Limpa as linhas de pavimento
            addPavementRow(); // Adiciona a primeira linha de pavimento novamente
            
        } catch (error) {
            console.error("Erro ao salvar empreendimento:", error);
            showToast('error', 'Erro ao Salvar', `Não foi possível cadastrar o empreendimento: ${error.message || error.details || 'Erro desconhecido'}`);
        } finally {
            hideLoading();
        }
    }
}

// Chame a função de inicialização quando o DOM estiver completamente carregado.
// Isso garante que todos os elementos HTML estejam disponíveis.
document.addEventListener('DOMContentLoaded', () => {
    initializeEmpreendimentoModule();
    // Adiciona a primeira linha de pavimento por padrão ao carregar a página
    document.getElementById('add-pavement-btn')?.click(); // Simula um clique para adicionar a primeira linha se o botão existir.
});