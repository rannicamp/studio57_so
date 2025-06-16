// public/js/rdo.js

import { supabase } from '/js/supabase-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from '/js/common.js';

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();
    
    // Configuração dos eventos da página
    document.getElementById('addMaoDeObra').addEventListener('click', addMaoDeObraRow);
    document.getElementById('addAtividade').addEventListener('click', addAtividadeRow);
    document.getElementById('addOcorrencia').addEventListener('click', addOcorrenciaRow);
    document.getElementById('fotos').addEventListener('change', previewFotos);
    document.getElementById('rdoForm').addEventListener('submit', saveRdo);

    // Carrega dados iniciais necessários
    await loadEmpreendimentos();
    addMaoDeObraRow(); // Adiciona uma linha inicial
    addAtividadeRow();
});

async function loadEmpreendimentos() {
    const select = document.getElementById('empreendimentoId');
    const { data, error } = await supabase.from('empreendimentos').select('id, nomeEmpreendimento');
    if (error) {
        showToast('error', 'Erro', 'Não foi possível carregar os empreendimentos.');
        return;
    }
    data.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.nomeEmpreendimento}</option>`;
    });
}

function addMaoDeObraRow() {
    const container = document.getElementById('maoDeObraContainer');
    const newRow = document.createElement('div');
    newRow.className = 'mao-de-obra-item form-grid';
    newRow.innerHTML = `
        <div class="form-group"><input type="text" class="form-control" placeholder="Função" data-field="funcao"></div>
        <div class="form-group"><input type="number" class="form-control" placeholder="Qtd." data-field="quantidade"></div>
        <button type="button" class="btn-delete action-buttons"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(newRow);
    newRow.querySelector('.btn-delete').addEventListener('click', () => newRow.remove());
}

function addAtividadeRow() {
    const container = document.getElementById('statusAtividadesContainer');
    const newRow = document.createElement('div');
    newRow.className = 'atividade-item form-grid';
    newRow.innerHTML = `
        <div class="form-group"><input type="text" class="form-control" placeholder="Descrição da Atividade" data-field="descricao"></div>
        <div class="form-group">
            <select class="form-control" data-field="status">
                <option value="Não Iniciada">Não Iniciada</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Atrasada">Atrasada</option>
            </select>
        </div>
        <button type="button" class="btn-delete action-buttons"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(newRow);
    newRow.querySelector('.btn-delete').addEventListener('click', () => newRow.remove());
}

function addOcorrenciaRow() {
    const container = document.getElementById('ocorrenciasContainer');
     const newRow = document.createElement('div');
    newRow.className = 'ocorrencia-item form-grid';
    newRow.innerHTML = `
        <div class="form-group"><textarea class="form-control" placeholder="Descreva a ocorrência ou observação" data-field="descricao" rows="2"></textarea></div>
        <button type="button" class="btn-delete action-buttons"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(newRow);
    newRow.querySelector('.btn-delete').addEventListener('click', () => newRow.remove());
}

function previewFotos(event) {
    const previewContainer = document.getElementById('fotos-preview');
    previewContainer.innerHTML = '';
    const files = event.target.files;
    for (const file of files) {
        const reader = new FileReader();
        reader.onload = e => {
            const previewItem = document.createElement('div');
            previewItem.className = 'foto-preview-item';
            previewItem.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    }
}

async function saveRdo(event) {
    event.preventDefault();
    showLoading('Salvando RDO...');

    try {
        // 1. Upload das fotos
        const fotosInput = document.getElementById('fotos');
        const uploadedFotos = [];
        for (const file of fotosInput.files) {
            const filePath = `public/rdo-fotos/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('rdo-fotos').upload(filePath, file);
            if (uploadError) throw new Error(`Falha no upload da foto: ${uploadError.message}`);
            
            const { data: urlData } = supabase.storage.from('rdo-fotos').getPublicUrl(filePath);
            uploadedFotos.push({
                url: urlData.publicUrl,
                path: filePath,
                name: file.name
            });
        }

        // 2. Coleta dos dados do formulário
        const empreendimentoSelect = document.getElementById('empreendimentoId');
        const rdoData = {
            empreendimentoId: empreendimentoSelect.value,
            empreendimentoNome: empreendimentoSelect.options[empreendimentoSelect.selectedIndex].text,
            dataRelatorio: document.getElementById('dataRelatorio').value,
            condicoesClimaticas: Array.from(document.querySelectorAll('[name="condicoesClimaticas"]:checked')).map(el => el.value),
            condicoesTrabalho: Array.from(document.querySelectorAll('[name="condicoesTrabalho"]:checked')).map(el => el.value),
            maoDeObra: Array.from(document.querySelectorAll('.mao-de-obra-item')).map(row => ({
                funcao: row.querySelector('[data-field="funcao"]').value,
                quantidade: parseInt(row.querySelector('[data-field="quantidade"]').value) || 0,
            })),
            statusAtividades: Array.from(document.querySelectorAll('.atividade-item')).map(row => ({
                descricao: row.querySelector('[data-field="descricao"]').value,
                status: row.querySelector('[data-field="status"]').value,
            })),
            ocorrencias: Array.from(document.querySelectorAll('.ocorrencia-item')).map(row => ({
                descricao: row.querySelector('[data-field="descricao"]').value,
            })),
            responsavelRdo: {
                nome: document.getElementById('responsavelNome').value,
                cargo: document.getElementById('responsavelCargo').value,
            },
            fotos: uploadedFotos,
            updatedAt: new Date().toISOString(),
        };

        // 3. Inserção no banco de dados
        const { error } = await supabase.from('rdo').insert(rdoData);
        if (error) throw error;
        
        hideLoading();
        showToast('success', 'Sucesso!', 'RDO salvo com sucesso.');
        document.getElementById('rdoForm').reset();
        document.getElementById('fotos-preview').innerHTML = '';

    } catch (error) {
        hideLoading();
        console.error('Erro ao salvar RDO:', error);
        showToast('error', 'Erro ao Salvar', `Ocorreu um problema: ${error.message}`);
    }
}