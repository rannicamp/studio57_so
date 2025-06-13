// public/js/lista-rdo.js (VERSÃO COM BOTÃO EDITAR E LÓGICA DE TRAVAMENTO CORRIGIDA)
import { collection, getDocs, query, orderBy, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

export function initializeListaRdoModule(db) {
    const filterEmpreendimento = document.getElementById('filter-empreendimento');
    const filterPeriodo = document.getElementById('filter-periodo');
    const customDateContainer = document.getElementById('custom-date-container');
    const filterDataInicio = document.getElementById('filter-data-inicio');
    const filterDataFim = document.getElementById('filter-data-fim');
    const rdoListBody = document.getElementById('rdo-list-body');

    async function loadEmpreendimentos() {
        filterEmpreendimento.innerHTML = '<option value="">Todos os Empreendimentos</option>';
        try {
            const empreendimentosRef = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);
            const snapshot = await getDocs(query(empreendimentosRef, orderBy("nomeEmpreendimento")));
            snapshot.forEach((doc) => {
                const data = doc.data();
                const opt = document.createElement("option");
                opt.value = doc.id;
                opt.textContent = data.nomeEmpreendimento || "Empreendimento sem nome";
                filterEmpreendimento.appendChild(opt);
            });
        } catch (error) {
            console.error("Erro ao carregar empreendimentos:", error);
            showToast('error', 'Erro de Rede', 'Não foi possível carregar os empreendimentos.');
        }
    }

    function getDateRange(period) {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                const startDateValue = filterDataInicio.value;
                const endDateValue = filterDataFim.value;
                if (!startDateValue || !endDateValue) return null;
                return {
                    start: new Date(startDateValue + 'T00:00:00'),
                    end: new Date(endDateValue + 'T23:59:59')
                };
            default: // 'all'
                return null;
        }
        return { start, end };
    }

    async function searchRdos() {
        showLoading();
        rdoListBody.innerHTML = '<p class="list-message">A procurar relatórios...</p>';
        try {
            const rdoRef = collection(db, `artifacts/${APP_COLLECTION_ID}/rdo`);
            let queries = [];

            const empId = filterEmpreendimento.value;
            if (empId) {
                queries.push(where("empreendimentoId", "==", empId));
            }
            
            const finalQuery = query(rdoRef, ...queries);
            const snapshot = await getDocs(finalQuery);
            let rdos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const period = filterPeriodo.value;
            const dateRange = getDateRange(period);
            if (dateRange) {
                rdos = rdos.filter(rdo => {
                    if (!rdo.dataRelatorio || !rdo.dataRelatorio.toDate) return false;
                    const rdoMillis = rdo.dataRelatorio.toDate().getTime();
                    return rdoMillis >= dateRange.start.getTime() && rdoMillis <= dateRange.end.getTime();
                });
            }

            rdos.sort((a, b) => b.dataRelatorio.seconds - a.dataRelatorio.seconds);

            if (rdos.length === 0) {
                rdoListBody.innerHTML = '<p class="list-message">Nenhum relatório encontrado para os filtros selecionados.</p>';
            } else {
                rdoListBody.innerHTML = '';
                rdos.forEach(rdoData => {
                    const row = createRdoRow(rdoData.id, rdoData);
                    rdoListBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error("Erro ao procurar RDOs:", error);
            rdoListBody.innerHTML = `<p class="list-message error-message">Ocorreu um erro inesperado durante a busca.</p>`;
            showToast('error', 'Erro na Busca', 'A consulta aos RDOs falhou.');
        } finally {
            hideLoading();
        }
    }

    // *** FUNÇÃO ATUALIZADA COM LÓGICA DE TRAVAMENTO CORRIGIDA ***
    function createRdoRow(id, rdo) {
        const row = document.createElement('div');
        row.className = 'rdo-list-item';
        row.dataset.id = id;
        
        const rdoDate = rdo.dataRelatorio.toDate();
        const dataRelatorioFormatada = rdoDate.toLocaleDateString('pt-BR');
        const responsavel = rdo.responsavelRdo?.nome || 'Não informado';
        const empreendimento = rdo.empreendimentoNome || 'N/A';
        const atividadesReportadas = rdo.statusAtividades?.length || 0;
        const presentes = (rdo.maoDeObra || []).filter(func => func.status === 'presente').length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        rdoDate.setHours(0, 0, 0, 0);
        const isPastRdo = rdoDate < today;

        // Atributos do botão Editar que mudam com base na data
        const editButtonTitle = isPastRdo ? 'RDO consolidado, não pode ser editado' : 'Editar RDO';
        const editButtonState = isPastRdo ? 'aria-disabled="true"' : '';
        const editButtonHref = isPastRdo ? '#' : `rdo.html?id=${id}`;

        row.innerHTML = `
            <div>${dataRelatorioFormatada}</div>
            <div>${empreendimento}</div>
            <div>${responsavel}</div>
            <div>${atividadesReportadas}</div>
            <div>${presentes}</div>
            <div class="rdo-list-action" style="display: flex; gap: 0.5rem;">
                <a href="${editButtonHref}" 
                   class="btn btn-primary-form btn-sm edit-rdo-btn" 
                   title="${editButtonTitle}"
                   ${editButtonState}>
                    <i class="fas fa-pencil-alt"></i> Editar
                </a>
                <a href="ver-rdo.html?id=${id}" class="btn btn-secondary-form btn-sm" title="Visualizar RDO">
                    <i class="fas fa-eye"></i> Visualizar
                </a>
            </div>
        `;
        
        return row;
    }

    function handlePeriodChange() {
        if (filterPeriodo.value === 'custom') {
            customDateContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
        }
        searchRdos();
    }
    
    filterEmpreendimento.addEventListener('change', searchRdos);
    filterPeriodo.addEventListener('change', handlePeriodChange);
    filterDataInicio.addEventListener('change', searchRdos);
    filterDataFim.addEventListener('change', searchRdos);

    loadEmpreendimentos();
    handlePeriodChange();
}