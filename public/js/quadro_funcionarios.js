// public/js/quadro_funcionarios.js

import { supabase } from './nhost-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from './common.js';

let allEmployees = []; // Guarda a lista completa de funcionários para a busca funcionar

// Roda o código quando a página terminar de carregar
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', filterEmployees);

    await loadEmployees();
});


/**
 * Busca a lista de todos os funcionários no Supabase.
 */
async function loadEmployees() {
    showLoading('Carregando funcionários...');
    const { data, error } = await supabase
        .from('funcionario')
        .select('*')
        .order('nomeCompleto', { ascending: true });

    hideLoading();
    if (error) {
        console.error('Erro ao carregar funcionários:', error);
        showToast('error', 'Erro', 'Não foi possível buscar a lista de funcionários.');
        return;
    }
    allEmployees = data;
    displayEmployees(allEmployees);
}

/**
 * Exibe os funcionários na tela, criando um card para cada um.
 * @param {Array<Object>} employees - A lista de funcionários a ser exibida.
 */
function displayEmployees(employees) {
    const grid = document.getElementById('funcionariosGrid');
    grid.innerHTML = ''; // Limpa a lista antiga

    if (employees.length === 0) {
        grid.innerHTML = '<p>Nenhum funcionário encontrado.</p>';
        return;
    }

    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'funcionario-card';

        // Converte a data de admissão para o formato brasileiro
        const dataAdmissao = employee.dataAdmissao 
            ? new Date(employee.dataAdmissao).toLocaleDateString('pt-BR') 
            : 'Não informada';

        card.innerHTML = `
            <img src="${employee.fotoFuncionarioUrl || 'https://via.placeholder.com/100'}" alt="Foto de ${employee.nomeCompleto}" class="foto">
            <h3 class="nome">${employee.nomeCompleto}</h3>
            <p class="cargo">${employee.cargo}</p>
            <p class="info">Admissão: ${dataAdmissao}</p>
            <p class="info">CPF: ${employee.cpf || 'Não informado'}</p>
            <div class="action-buttons">
                <a href="registro_funcionario.html?id=${employee.id}" class="btn-edit" title="Editar"><i class="fas fa-edit"></i></a>
                <button class="btn-delete" data-id="${employee.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Adiciona o evento de clique para cada botão de deletar
    grid.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (event) => {
            const id = event.currentTarget.dataset.id;
            if (confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.')) {
                await deleteEmployee(id);
            }
        });
    });
}

/**
 * Deleta um funcionário do banco de dados.
 * @param {string} id - O ID do funcionário a ser deletado.
 */
async function deleteEmployee(id) {
    showLoading('Excluindo...');

    // Futuramente, podemos adicionar a lógica para deletar os arquivos do Storage aqui.
    // Por enquanto, vamos apenas deletar o registro do banco de dados.

    const { error } = await supabase
        .from('funcionario')
        .delete()
        .eq('id', id);

    hideLoading();
    if (error) {
        console.error('Erro ao excluir funcionário:', error);
        showToast('error', 'Erro', 'Não foi possível excluir o funcionário.');
    } else {
        showToast('success', 'Sucesso', 'Funcionário excluído.');
        loadEmployees(); // Recarrega a lista para refletir a exclusão
    }
}


/**
 * Filtra a lista de funcionários exibida com base no texto digitado na busca.
 */
function filterEmployees() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredEmployees = allEmployees.filter(employee => {
        const nome = employee.nomeCompleto?.toLowerCase() || '';
        const cargo = employee.cargo?.toLowerCase() || '';
        const cpf = employee.cpf?.toString() || '';
        
        return nome.includes(searchTerm) || cargo.includes(searchTerm) || cpf.includes(searchTerm);
    });
    displayEmployees(filteredEmployees);
}