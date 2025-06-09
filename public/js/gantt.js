// public/js/gantt.js (CORRIGIDO E REESTRUTURADO)
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from "./firebase-config.js";
import { showToast } from './common.js';

export function initializeGanttModule(db) {
    // Mapeamento dos elementos do formulário
    const selectEmpreendimento = document.getElementById("select-empreendimento");
    const ganttActionsContainer = document.getElementById("gantt-actions-container");
    const nomeAtividadeInput = document.getElementById("atividade-nome");
    const etapaAtividadeInput = document.getElementById("atividade-etapa");
    const descricaoAtividadeInput = document.getElementById("atividade-descricao");
    const dataInicioInput = document.getElementById("data-inicio");
    const duracaoInput = document.getElementById("duracao-input");
    const dataFimInput = document.getElementById("data-fim");
    const btnSalvarAtividade = document.getElementById("btn-salvar-atividade");
    const ganttPlaceholder = document.querySelector(".gantt-chart-placeholder");

    // --- Funções do Módulo ---

    async function carregarEmpreendimentos() {
        if (!selectEmpreendimento) return;
        selectEmpreendimento.innerHTML = '<option value="">Carregando...</option>';
        try {
            const empreendimentosRef = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);
            const snapshot = await getDocs(query(empreendimentosRef));
            
            if (snapshot.empty) {
                selectEmpreendimento.innerHTML = '<option value="">Nenhum empreendimento cadastrado</option>';
                return;
            }

            selectEmpreendimento.innerHTML = '<option value="">Selecione um empreendimento</option>';
            snapshot.forEach((doc) => {
                const opt = document.createElement("option");
                opt.value = doc.id;
                opt.textContent = doc.data().nomeEmpreendimento || "Empreendimento sem nome";
                selectEmpreendimento.appendChild(opt);
            });
        } catch (error) {
            console.error("Erro ao carregar empreendimentos:", error);
            selectEmpreendimento.innerHTML = '<option value="">Erro ao carregar</option>';
            showToast('error', 'Erro', 'Não foi possível carregar os empreendimentos.');
        }
    }

    async function carregarAtividades() {
        const empId = selectEmpreendimento.value;
        ganttActionsContainer.style.display = empId ? 'block' : 'none';

        if (!empId) {
            ganttPlaceholder.innerHTML = "Selecione um empreendimento para ver o cronograma.";
            return;
        }
        
        ganttPlaceholder.innerHTML = "Carregando cronograma...";

        try {
            const atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
            const q = query(atividadesRef, where("empreendimentoId", "==", empId));
            const snapshot = await getDocs(q);
            const atividades = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            if (atividades.length === 0) {
                 ganttPlaceholder.innerHTML = "Nenhuma atividade encontrada para este empreendimento.";
            } else {
                renderizarGantt(atividades);
            }
        } catch (e) {
            console.error("Erro ao carregar atividades:", e);
            ganttPlaceholder.innerHTML = "Erro ao carregar o cronograma.";
            showToast('error', 'Erro', 'Não foi possível carregar o cronograma.');
        }
    }

    function renderizarGantt(atividades) {
      ganttPlaceholder.innerHTML = "";
      const container = document.createElement("div");
      container.className = "gantt-chart";

      atividades.sort((a, b) => (a.dataInicio?.seconds || 0) - (b.dataInicio?.seconds || 0));

      const minDate = new Date(atividades[0].dataInicio.seconds * 1000);
      const maxDate = new Date(Math.max(...atividades.map(a => a.dataFim.seconds)) * 1000);
      const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24) + 1;

      atividades.forEach((a) => {
        const startDate = new Date(a.dataInicio.seconds * 1000);
        const endDate = new Date(a.dataFim.seconds * 1000);

        const startOffset = (startDate - minDate) / (1000 * 60 * 60 * 24);
        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;

        const left = (startOffset / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        const linha = document.createElement("div");
        linha.className = 'gantt-row';
        
        const label = document.createElement('div');
        label.className = 'gantt-label';
        label.textContent = a.nome || 'Atividade';
        label.title = `${a.nome} (${a.etapa || '-'})`;

        const barContainer = document.createElement('div');
        barContainer.className = 'gantt-bar-container';

        const bar = document.createElement("div");
        bar.className = 'gantt-bar';
        bar.style.left = `${left}%`;
        bar.style.width = `${width}%`;
        bar.textContent = a.descricao || '';
        bar.title = `Início: ${startDate.toLocaleDateString('pt-BR')} \nFim: ${endDate.toLocaleDateString('pt-BR')}`;
        
        barContainer.appendChild(bar);
        linha.appendChild(label);
        linha.appendChild(barContainer);
        container.appendChild(linha);
      });

      ganttPlaceholder.appendChild(container);
    }
    
    function atualizarDataFim() {
        const inicioStr = dataInicioInput.value;
        const duracaoDias = parseFloat(duracaoInput.value);
        if (!inicioStr || isNaN(duracaoDias) || duracaoDias <= 0) {
            dataFimInput.value = "";
            return;
        }
        const inicio = new Date(inicioStr + "T00:00:00");
        const fim = new Date(inicio.getTime() + (duracaoDias - 1) * 24 * 60 * 60 * 1000);
        dataFimInput.value = fim.toISOString().split('T')[0];
    }

    async function salvarAtividade() {
        const empId = selectEmpreendimento.value;
        const nome = nomeAtividadeInput.value.trim();
        const etapa = etapaAtividadeInput.value.trim();
        const descricao = descricaoAtividadeInput.value.trim();
        const inicioStr = dataInicioInput.value;
        const fimStr = dataFimInput.value;

        if (!empId || !nome || !inicioStr || !fimStr) {
            showToast('error','Campos Obrigatórios', "Preencha o Nome da Atividade, Data de Início e Duração.");
            return;
        }

        btnSalvarAtividade.disabled = true;
        btnSalvarAtividade.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            const atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
            await addDoc(atividadesRef, {
                nome, etapa, descricao, empreendimentoId: empId,
                dataInicio: Timestamp.fromDate(new Date(inicioStr + "T00:00:00")),
                dataFim: Timestamp.fromDate(new Date(fimStr + "T00:00:00")),
                criadoEm: serverTimestamp()
            });

            nomeAtividadeInput.value = ""; etapaAtividadeInput.value = "";
            descricaoAtividadeInput.value = ""; dataInicioInput.value = "";
            duracaoInput.value = ""; dataFimInput.value = "";
            
            showToast('success', 'Sucesso!', 'Atividade salva com sucesso.');
            carregarAtividades();
        } catch (e) {
            console.error("Erro ao salvar atividade:", e);
            showToast('error', 'Erro', 'Não foi possível salvar a atividade.');
        } finally {
            btnSalvarAtividade.disabled = false;
            btnSalvarAtividade.innerHTML = '<i class="fas fa-plus"></i> Adicionar Atividade';
        }
    }

    // --- Inicialização dos Eventos ---
    selectEmpreendimento?.addEventListener('change', carregarAtividades);
    dataInicioInput?.addEventListener('change', atualizarDataFim);
    duracaoInput?.addEventListener('input', atualizarDataFim);
    btnSalvarAtividade?.addEventListener("click", salvarAtividade);

    // Carrega os dados iniciais da página
    carregarEmpreendimentos();
}