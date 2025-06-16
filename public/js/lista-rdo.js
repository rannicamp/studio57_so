import { supabase } from '/js/supabase-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from '/js/common.js';

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();
    loadRdos();
});

async function loadRdos() {
    showLoading('Carregando relatórios...');
    const { data, error } = await supabase
        .from('rdo')
        .select('*')
        .order('dataRelatorio', { ascending: false });
    
    hideLoading();
    if (error) {
        showToast('error', 'Erro', 'Não foi possível carregar os RDOs.');
        console.error(error);
        return;
    }

    const tableBody = document.getElementById('rdoTable').querySelector('tbody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Nenhum relatório encontrado.</td></tr>';
        return;
    }

    data.forEach(rdo => {
        const row = tableBody.insertRow();
        const dataFormatada = new Date(rdo.dataRelatorio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        row.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${rdo.empreendimentoNome}</td>
            <td>${rdo.responsavelRdo?.nome || 'Não informado'}</td>
            <td class="action-buttons">
                <a href="/ver-rdo.html?id=${rdo.id}" class="btn-view" title="Visualizar"><i class="fas fa-eye"></i></a>
                <button class="btn-delete" data-id="${rdo.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });

    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Tem certeza que deseja excluir este RDO?')) {
                await deleteRdo(id);
            }
        });
    });
}

async function deleteRdo(id) {
    showLoading('Excluindo...');
    const { error } = await supabase.from('rdo').delete().eq('id', id);
    hideLoading();
    if (error) {
        showToast('error', 'Erro ao excluir', 'Não foi possível remover o relatório.');
    } else {
        showToast('success', 'Sucesso', 'RDO excluído.');
        loadRdos();
    }
}