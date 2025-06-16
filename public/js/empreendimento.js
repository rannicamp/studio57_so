// public/js/empreendimento.js

import { supabase } from './supabase-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from './common.js';

// Lista de todos os IDs de campos do formulário para facilitar o manuseio
const fieldIds = [
    'nomeEmpreendimento', 'usoImovel', 'descricaoProjeto', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado',
    'lote', 'quadra', 'zona', 'via', 'areaTerreno', 'proprietarioNome', 'proprietarioCpfCnpj', 'responsavelTecnicoNome',
    'cauCrea', 'numPavimentos', 'coefAproveitamento', 'taxaPermeabilidade', 'unidadesResidenciais', 'unidadesNaoResidenciais',
    'vagasEstacionamento', 'observacoesEdificacao', 'statusAprovacao', 'dataAprovacao', 'numProcesso', 'responsavelAprovacao'
];

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();

    const form = document.getElementById('empreendimentoForm');
    const pageTitle = document.getElementById('pageTitle');
    const addAreaRowBtn = document.getElementById('addAreaRow');

    const urlParams = new URLSearchParams(window.location.search);
    const empreendimentoId = urlParams.get('id');

    if (empreendimentoId) {
        pageTitle.textContent = "Editar Empreendimento";
        showLoading('Carregando dados do empreendimento...');
        await loadEmpreendimentoData(empreendimentoId);
        hideLoading();
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveEmpreendimento(empreendimentoId);
    });

    addAreaRowBtn.addEventListener('click', () => addAreaRow());
});

/**
 * Adiciona uma nova linha à tabela do Quadro de Áreas.
 */
function addAreaRow(data = { pavimento: '', uso: '', area: '' }) {
    const tableBody = document.getElementById('quadroDeAreasTable').querySelector('tbody');
    const newRow = tableBody.insertRow();
    newRow.innerHTML = `
        <td><input type="text" class="form-control" value="${data.pavimento}" data-field="pavimento"></td>
        <td><input type="text" class="form-control" value="${data.uso}" data-field="uso"></td>
        <td><input type="number" class="form-control" value="${data.area}" data-field="area" step="0.01"></td>
        <td><button type="button" class="btn-delete action-buttons"><i class="fas fa-trash-alt"></i></button></td>
    `;
    newRow.querySelector('.btn-delete').addEventListener('click', () => {
        newRow.remove();
    });
}

/**
 * Carrega os dados de um empreendimento do Supabase e preenche o formulário.
 * @param {string} id - O ID do empreendimento.
 */
async function loadEmpreendimentoData(id) {
    const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Erro ao carregar dados do empreendimento:', error);
        showToast('error', 'Erro', 'Empreendimento não encontrado.');
        return;
    }

    // Preenche todos os campos de texto e numéricos
    fieldIds.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && data[fieldId] !== null) {
            element.value = data[fieldId];
        }
    });

    // Preenche a tabela do Quadro de Áreas
    if (data.quadroDeAreas && Array.isArray(data.quadroDeAreas)) {
        data.quadroDeAreas.forEach(area => addAreaRow(area));
    }
}


/**
 * Coleta os dados do Quadro de Áreas da tabela do formulário.
 * @returns {Array<Object>} Um array de objetos, cada um representando uma linha da tabela.
 */
function getQuadroDeAreasData() {
    const tableBody = document.getElementById('quadroDeAreasTable').querySelector('tbody');
    const rows = tableBody.querySelectorAll('tr');
    const data = [];
    rows.forEach(row => {
        const rowData = {
            pavimento: row.querySelector('[data-field="pavimento"]').value,
            uso: row.querySelector('[data-field="uso"]').value,
            area: parseFloat(row.querySelector('[data-field="area"]').value) || 0
        };
        data.push(rowData);
    });
    return data;
}

/**
 * Salva os dados do formulário no Supabase (cria ou atualiza).
 * @param {string|null} empreendimentoId - O ID do empreendimento, se estiver editando.
 */
async function saveEmpreendimento(empreendimentoId) {
    showLoading('Salvando empreendimento...');

    try {
        // Coleta os dados de todos os campos do formulário
        const empreendimentoData = {};
        fieldIds.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element.type === 'number') {
                empreendimentoData[fieldId] = parseFloat(element.value) || null;
            } else if (element.type === 'date') {
                 empreendimentoData[fieldId] = element.value || null;
            }
            else {
                empreendimentoData[fieldId] = element.value || null;
            }
        });
        
        // Coleta os dados da tabela de áreas
        empreendimentoData.quadroDeAreas = getQuadroDeAreasData();

        let error;
        if (empreendimentoId) {
            // Se estamos editando, faz um UPDATE
            const { error: updateError } = await supabase
                .from('empreendimentos')
                .update(empreendimentoData)
                .eq('id', empreendimentoId);
            error = updateError;
        } else {
            // Se não, faz um INSERT
            const { error: insertError } = await supabase
                .from('empreendimentos')
                .insert(empreendimentoData);
            error = insertError;
        }

        if (error) {
            throw error;
        }

        hideLoading();
        showToast('success', 'Sucesso!', `Empreendimento ${empreendimentoId ? 'atualizado' : 'cadastrado'} com sucesso.`);
        
        // Limpa o formulário após o cadastro bem-sucedido (se não estiver editando)
        if (!empreendimentoId) {
             document.getElementById('empreendimentoForm').reset();
             document.getElementById('quadroDeAreasTable').querySelector('tbody').innerHTML = '';
        }

    } catch (error) {
        hideLoading();
        console.error('Erro ao salvar empreendimento:', error);
        showToast('error', 'Erro ao Salvar', `Ocorreu um problema: ${error.message}`);
    }
}