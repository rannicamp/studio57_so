// public/js/gantt.js (REPROGRAMADO E CORRIGIDO)
import { collection, getDocs, addDoc, serverTimestamp, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from "./firebase-config.js";
import { showToast } from './common.js';

// A função principal que organiza todo o código da página
export function initializeGanttModule(db) {
    
    // Mapeamento dos elementos da página
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
            showToast('error', 'Erro de Rede', 'Não foi possível carregar a lista de empreendimentos.');
        }
    }

    async function carregarAtividades() {
        const empId = selectEmpreendimento.value;
        // Mostra/esconde o formulário de adicionar atividade
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
            ganttPlaceholder.innerHTML = "Ocorreu um erro ao carregar o cronograma.";
            showToast('error', 'Erro de Rede', 'Não foi possível carregar as atividades do cronograma.');
        }
    }

    function renderizarGantt(atividades) {
      ganttPlaceholder.innerHTML = "";
      const container = document.createElement("div");
      container.className = "gantt-chart";

      // Ordena por data de início e encontra o período total do projeto
      atividades.sort((a, b) => (a.dataInicio?.seconds || 0) - (b.dataInicio?.seconds || 0));
      
      if (atividades.length === 0) return;

      const minDate = new Date(atividades[0].dataInicio.seconds * 1000);
      const maxDate = new Date(Math.max(...atividades.map(a => a.dataFim.seconds)) * 1000);
      const totalDays = Math.max(((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1, 1);

      atividades.forEach((a) => {
        const startDate = new Date(a.dataInicio.seconds * 1000);
        const endDate = new Date(a.dataFim.seconds * 1000);
        
        const startOffset = (startDate - minDate) / (1000 * 60 * 60 * 24);
        const duration = ((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        const leftPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        const row = document.createElement("div");
        row.className = 'gantt-row';
        
        const label = document.createElement('div');
        label.className = 'gantt-label';
        label.textContent = a.nome || 'Atividade';
        label.title = `${a.nome} (${a.etapa || '-'})`;

        const barContainer = document.createElement('div');
        barContainer.className = 'gantt-bar-container';

        const bar = document.createElement("div");
        bar.className = 'gantt-bar';
        bar.style.left = `${leftPercent}%`;
        bar.style.width = `${widthPercent}%`;
        bar.textContent = a.descricao || '';
        bar.title = `Início: ${startDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'})} \nFim: ${endDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'})}`;
        
        barContainer.appendChild(bar);
        row.appendChild(label);
        row.appendChild(barContainer);
        container.appendChild(row);
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