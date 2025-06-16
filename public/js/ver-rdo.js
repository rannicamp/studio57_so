import { supabase } from '/js/supabase-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from '/js/common.js';

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();

    const urlParams = new URLSearchParams(window.location.search);
    const rdoId = urlParams.get('id');

    if (!rdoId) {
        showToast('error', 'Erro', 'ID do relatório não fornecido.');
        return;
    }

    loadRdoDetails(rdoId);
});

async function loadRdoDetails(id) {
    showLoading('Carregando detalhes...');
    const { data, error } = await supabase.from('rdo').select('*').eq('id', id).single();
    hideLoading();

    if (error || !data) {
        showToast('error', 'Erro', 'Não foi possível carregar os detalhes do RDO.');
        return;
    }

    const container = document.getElementById('rdo-details-container');
    const dataFormatada = new Date(data.dataRelatorio).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    let fotosHTML = 'Nenhuma foto anexada.';
    if (data.fotos && data.fotos.length > 0) {
        fotosHTML = data.fotos.map(foto => `
            <a href="${foto.url}" target="_blank" class="foto-preview-item">
                <img src="${foto.url}" alt="${foto.name || 'Foto do RDO'}">
            </a>
        `).join('');
    }

    container.innerHTML = `
        <div class="card">
            <h2 class="card-header">RDO - ${data.empreendimentoNome} - ${dataFormatada}</h2>
            <p><strong>Responsável:</strong> ${data.responsavelRdo?.nome} (${data.responsavelRdo?.cargo})</p>
        </div>
        
        <div class="card">
            <h3 class="form-section-title">Condições do Dia</h3>
            <p><strong>Clima:</strong> ${data.condicoesClimaticas.join(', ') || 'Não informado'}</p>
            <p><strong>Trabalho:</strong> ${data.condicoesTrabalho.join(', ') || 'Não informado'}</p>
        </div>

        <div class="card">
            <h3 class="form-section-title">Mão de Obra</h3>
            <ul>
                ${data.maoDeObra.map(item => `<li>${item.quantidade}x ${item.funcao}</li>`).join('')}
            </ul>
        </div>

        <div class="card">
            <h3 class="form-section-title">Andamento das Atividades</h3>
            <ul>
                ${data.statusAtividades.map(item => `<li><strong>${item.descricao}:</strong> ${item.status}</li>`).join('')}
            </ul>
        </div>

        <div class="card">
            <h3 class="form-section-title">Ocorrências e Observações</h3>
             <ul>
                ${data.ocorrencias.map(item => `<li>${item.descricao}</li>`).join('')}
            </ul>
        </div>

        <div class="card">
            <h3 class="form-section-title">Fotos</h3>
            <div class="fotos-preview">${fotosHTML}</div>
        </div>
    `;
}