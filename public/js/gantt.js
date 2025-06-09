// public/js/gantt.js (VERSÃO COMPLETA E CORRIGIDA COM LÓGICA DE DURAÇÃO)
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from "./firebase-config.js";
import { showToast } from './common.js';

export function initializeGanttModule(db) {
    
    // Mapeamento dos elementos
    const selectEmpreendimento = document.getElementById("select-empreendimento");
    const ganttChartContainer = document.getElementById("gantt-chart-container");
    const ganttPlaceholder = document.getElementById("gantt-placeholder");
    
    // Controles do Modal
    const modal = document.getElementById('activity-modal');
    const modalForm = document.getElementById('gantt-modal-form');
    const modalTitle = document.getElementById('modal-title');
    const modalActivityId = document.getElementById('modal-activity-id');
    const modalActivityName = document.getElementById('modal-activity-name');
    const modalActivityStage = document.getElementById('modal-activity-stage');
    const modalActivityDesc = document.getElementById('modal-activity-desc');
    const modalStartDate = document.getElementById('modal-start-date');
    const modalEndDate = document.getElementById('modal-end-date');
    const modalDuration = document.getElementById('modal-duration'); // Novo campo
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let currentActivities = [];
    const viewModes = ['day', 'week', 'month'];
    let currentViewModeIndex = 0;
    let dayWidths = [50, 14, 4];

    // Lógica de Cores
    const stageColors = {};
    const colorPalette = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ef4444", "#14b8a6", "#6366f1", "#f59e0b"];
    let nextColorIndex = 0;
    
    function getColorForStage(stage) {
        if (!stage) return "#a1a1aa";
        if (!stageColors[stage]) {
            stageColors[stage] = colorPalette[nextColorIndex % colorPalette.length];
            nextColorIndex++;
        }
        return stageColors[stage];
    }
    
    // --- LÓGICA DO MODAL E CÁLCULO DE DATAS ---
    
    function calculateEndDate() {
        const startDate = modalStartDate.value;
        const duration = parseInt(modalDuration.value, 10);
        if (startDate && duration > 0) {
            const start = new Date(startDate + 'T00:00:00');
            const end = addDays(start, duration - 1);
            modalEndDate.value = end.toISOString().split('T')[0];
        }
    }

    function calculateDuration() {
        const startDate = modalStartDate.value;
        const endDate = modalEndDate.value;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end >= start) {
                const duration = getDaysBetween(start, end) + 1;
                modalDuration.value = duration;
            } else {
                modalDuration.value = '';
            }
        }
    }

    function openModal(activity = null) {
        modalForm.reset();
        if (activity) {
            modalTitle.textContent = 'Editar Atividade';
            modalActivityId.value = activity.id;
            modalActivityName.value = activity.nome;
            modalActivityStage.value = activity.etapa;
            modalActivityDesc.value = activity.descricao;
            modalStartDate.value = new Date(activity.dataInicio.seconds * 1000).toISOString().split('T')[0];
            modalEndDate.value = new Date(activity.dataFim.seconds * 1000).toISOString().split('T')[0];
            calculateDuration(); // Calcula e preenche a duração ao editar
        } else {
            modalTitle.textContent = 'Nova Atividade';
            modalActivityId.value = '';
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }
    
    async function saveModalData(e) {
        e.preventDefault();
        const id = modalActivityId.value;
        const data = {
            nome: modalActivityName.value.trim(),
            etapa: modalActivityStage.value.trim(),
            descricao: modalActivityDesc.value.trim(),
            dataInicio: Timestamp.fromDate(new Date(modalStartDate.value + 'T00:00:00')),
            dataFim: Timestamp.fromDate(new Date(modalEndDate.value + 'T00:00:00')),
            empreendimentoId: selectEmpreendimento.value
        };

        if (!data.nome || !modalStartDate.value || !modalEndDate.value) {
            showToast('error', 'Campos Obrigatórios', 'Preencha nome, data de início e data de fim.');
            return;
        }

        modalSaveBtn.disabled = true;
        modalSaveBtn.textContent = 'Salvando...';

        try {
            if (id) {
                await updateDoc(doc(db, `artifacts/${APP_COLLECTION_ID}/atividades`, id), data);
                showToast('success', 'Sucesso', 'Atividade atualizada.');
            } else {
                await addDoc(collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`), { ...data, criadoEm: serverTimestamp() });
                showToast('success', 'Sucesso', 'Atividade criada.');
            }
            closeModal();
            loadAndRender();
        } catch (err) {
            console.error("Erro ao salvar atividade:", err);
            showToast('error', 'Erro', 'Não foi possível salvar a atividade.');
        } finally {
            modalSaveBtn.disabled = false;
            modalSaveBtn.textContent = 'Salvar Atividade';
        }
    }
    
    // As outras funções (renderGantt, loadAndRender, etc.) permanecem as mesmas
    // ...
    function renderGantt() {
        ganttChartContainer.style.display = 'block';
        ganttPlaceholder.style.display = 'none';
        ganttChartContainer.innerHTML = '';

        const activities = currentActivities;
        if (activities.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.innerHTML = '<p style="padding: 2rem; text-align: center;">Nenhuma atividade cadastrada para este empreendimento.</p>';
            ganttChartContainer.appendChild(renderHeaderControls());
            ganttChartContainer.appendChild(emptyMessage);
            return;
        }

        const viewMode = viewModes[currentViewModeIndex];
        const dayWidth = dayWidths[currentViewModeIndex];

        activities.sort((a, b) => a.dataInicio.seconds - b.dataInicio.seconds);
        const projectStartDate = new Date(activities[0].dataInicio.seconds * 1000);
        projectStartDate.setDate(projectStartDate.getDate() - 5);
        const projectEndDate = new Date(Math.max(...activities.map(a => a.dataFim.seconds)) * 1000);
        projectEndDate.setDate(projectEndDate.getDate() + 5);
        
        const headerControls = renderHeaderControls();
        const mainChart = renderMainChart(activities, projectStartDate, projectEndDate, dayWidth, viewMode);
        
        ganttChartContainer.append(headerControls, mainChart);
    }
    
    function renderHeaderControls() {
        const controls = document.createElement('div');
        controls.className = 'gantt-header-controls';
        
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Atividade';
        btn.onclick = () => openModal();

        const zoomControls = document.createElement('div');
        zoomControls.className = 'gantt-view-controls';
        zoomControls.innerHTML = `
            <label class="form-label" style="margin-bottom: 0;">Zoom:</label>
            <button class="btn btn-outline-form btn-zoom" title="Aumentar Zoom">+</button>
            <button class="btn btn-outline-form btn-zoom" title="Diminuir Zoom">−</button>
        `;
        
        controls.append(btn, zoomControls);

        zoomControls.querySelector('button:nth-child(2)').onclick = () => {
            currentViewModeIndex = Math.max(currentViewModeIndex - 1, 0);
            renderGantt();
        };
        zoomControls.querySelector('button:nth-child(3)').onclick = () => {
             currentViewModeIndex = Math.min(currentViewModeIndex + 1, viewModes.length - 1);
            renderGantt();
        };

        return controls;
    }
    
    function renderMainChart(activities, projectStartDate, projectEndDate, dayWidth, viewMode) {
        const main = document.createElement('div');
        main.className = 'gantt-chart-main';
        const sidebar = renderSidebar(activities);
        const timeline = renderTimeline(activities, projectStartDate, projectEndDate, dayWidth, viewMode);
        main.append(sidebar, timeline);
        return main;
    }

    function renderSidebar(activities) { 
        const sidebar = document.createElement('div');
        sidebar.className = 'gantt-sidebar';
        
        const header = document.createElement('div');
        header.className = 'gantt-header-title';
        header.textContent = 'Etapa / Atividade';
        sidebar.appendChild(header);

        activities.forEach(activity => {
            const taskName = document.createElement('div');
            taskName.className = 'gantt-task-name';
            taskName.innerHTML = `<strong>${activity.etapa || 'Geral'}</strong>: ${activity.nome}`;
            taskName.title = activity.nome;
            taskName.onclick = () => openModal(activity);
            sidebar.appendChild(taskName);
        });
        return sidebar;
    }

    function renderTimeline(activities, projectStartDate, projectEndDate, dayWidth, viewMode) { 
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'gantt-timeline-container';
        const timeline = document.createElement('div');
        timeline.className = 'gantt-timeline';
        const daysInProject = getDaysBetween(projectStartDate, projectEndDate);
        timeline.style.width = `${daysInProject * dayWidth}px`;
        const header = renderTimelineHeader(projectStartDate, daysInProject, dayWidth, viewMode);
        const grid = renderTimelineGrid(activities, daysInProject, dayWidth);
        activities.forEach((activity, index) => grid.appendChild(renderTaskBar(activity, projectStartDate, dayWidth, index)));
        const todayMarker = renderTodayMarker(projectStartDate, dayWidth);
        if (todayMarker) grid.appendChild(todayMarker);
        timeline.append(header, grid);
        timelineContainer.appendChild(timeline);
        setTimeout(() => {
            if (todayMarker) {
                timelineContainer.scrollLeft = parseInt(todayMarker.style.left) - (timelineContainer.clientWidth / 2);
            }
        }, 100);
        return timelineContainer;
    }

    function renderTimelineHeader(startDate, totalDays, dayWidth, viewMode) {
        const headerContainer = document.createElement('div');
        headerContainer.className = 'gantt-header';
        const monthRow = document.createElement('div');
        monthRow.className = 'gantt-header-row';
        const dayRow = document.createElement('div');
        dayRow.className = 'gantt-header-row';
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        let currentMonth = -1;

        for (let i = 0; i < totalDays; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'gantt-header-cell day';
            dayCell.style.width = `${dayWidth}px`;
            if(dayWidth > 30) dayCell.textContent = currentDate.getDate();
            dayRow.appendChild(dayCell);
            
            if (currentDate.getMonth() !== currentMonth) {
                currentMonth = currentDate.getMonth();
                const monthCell = document.createElement('div');
                monthCell.className = 'gantt-header-cell month';
                const daysInMonth = new Date(currentDate.getFullYear(), currentMonth + 1, 0).getDate();
                const remainingDays = daysInMonth - currentDate.getDate() + 1;
                monthCell.style.width = `${Math.min(remainingDays, totalDays - i) * dayWidth}px`;
                monthCell.textContent = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                monthRow.appendChild(monthCell);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        headerContainer.append(monthRow, dayRow);
        return headerContainer;
    }
    
    function renderTimelineGrid(activities, totalDays, dayWidth) {
        const grid = document.createElement('div');
        grid.className = 'gantt-grid';
        activities.forEach(() => {
            const row = document.createElement('div');
            row.className = 'gantt-grid-row';
            for (let i = 0; i < totalDays; i++) {
                const cell = document.createElement('div');
                cell.className = 'gantt-grid-cell';
                cell.style.width = `${dayWidth}px`;
                row.appendChild(cell);
            }
            grid.appendChild(row);
        });
        return grid;
    }

    function renderTaskBar(activity, projectStartDate, dayWidth, index) {
        const startDate = new Date(activity.dataInicio.seconds * 1000);
        const endDate = new Date(activity.dataFim.seconds * 1000);
        const leftOffsetDays = getDaysBetween(projectStartDate, startDate);
        const durationDays = getDaysBetween(startDate, endDate) + 1;

        const bar = document.createElement('div');
        bar.className = 'gantt-task-bar';
        bar.style.left = `${leftOffsetDays * dayWidth}px`;
        bar.style.width = `${durationDays * dayWidth - 2}px`;
        bar.style.top = `${index * 40 + 5}px`;
        bar.style.backgroundColor = getColorForStage(activity.etapa);
        bar.textContent = activity.nome;
        bar.title = `${activity.etapa || 'Geral'}: ${activity.nome}\nInício: ${startDate.toLocaleDateString('pt-BR')}\nFim: ${endDate.toLocaleDateString('pt-BR')}`;
        bar.onclick = () => openModal(activity);
        return bar;
    }

    function renderTodayMarker(projectStartDate, dayWidth) {
        const today = new Date();
        today.setHours(0,0,0,0);
        projectStartDate.setHours(0,0,0,0);
        if (today < projectStartDate) return null;
        const leftOffsetDays = getDaysBetween(projectStartDate, today);
        const marker = document.createElement('div');
        marker.className = 'gantt-today-marker';
        marker.style.left = `${leftOffsetDays * dayWidth + (dayWidth / 2)}px`;
        return marker;
    }

    function getDaysBetween(date1, date2) {
        return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    async function loadAndRender() {
        const empId = selectEmpreendimento.value;
        if (!empId) {
            ganttChartContainer.style.display = 'none';
            ganttPlaceholder.style.display = 'block';
            ganttPlaceholder.textContent = "Selecione um empreendimento para ver o cronograma.";
            return;
        }
        ganttPlaceholder.style.display = 'block';
        ganttPlaceholder.textContent = "Carregando cronograma...";
        try {
            const atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
            const q = query(atividadesRef, where("empreendimentoId", "==", empId));
            const snapshot = await getDocs(q);
            currentActivities = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.dataInicio && a.dataFim);
            renderGantt();
        } catch (e) {
            console.error("Erro ao carregar atividades:", e);
            ganttPlaceholder.textContent = "Ocorreu um erro ao carregar o cronograma.";
            showToast('error', 'Erro de Rede', 'Não foi possível carregar as atividades.');
        }
    }
    
    async function carregarEmpreendimentos() {
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
            showToast('error', 'Erro de Rede', 'Não foi possível carregar os empreendimentos.');
        }
    }
    
    // --- Event Listeners ---
    selectEmpreendimento?.addEventListener('change', loadAndRender);
    modalForm.addEventListener('submit', saveModalData);
    modalCancelBtn.addEventListener('click', closeModal);
    modalCloseBtn.addEventListener('click', closeModal);
    
    // CORREÇÃO: A lógica de cálculo agora está correta e mais intuitiva.
    modalStartDate.addEventListener('change', calculateEndDate);
    modalEndDate.addEventListener('change', calculateDuration);
    modalDuration.addEventListener('input', calculateEndDate);

    carregarEmpreendimentos();
}
