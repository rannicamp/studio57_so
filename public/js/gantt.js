import { supabase } from '/js/supabase-config.js';
import { checkAuthAndRedirect, showToast } from '/js/common.js';

let gantt;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();
    await loadEmpreendimentos();

    document.getElementById('empreendimentoId').addEventListener('change', (e) => {
        const empreendimentoId = e.target.value;
        if (empreendimentoId) {
            loadGanttData(empreendimentoId);
        }
    });
});

async function loadEmpreendimentos() {
    const select = document.getElementById('empreendimentoId');
    const { data, error } = await supabase.from('empreendimentos').select('id, nomeEmpreendimento');
    
    if (error) {
        showToast('error', 'Erro', 'Não foi possível carregar os empreendimentos.');
        return;
    }

    select.innerHTML = '<option value="">Selecione um empreendimento</option>';
    data.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.nomeEmpreendimento}</option>`;
    });
}

async function loadGanttData(empreendimentoId) {
    const { data, error } = await supabase
        .from('atividades')
        .select('*')
        .eq('empreendimentoId', empreendimentoId);

    if (error) {
        showToast('error', 'Erro', 'Não foi possível carregar as atividades do cronograma.');
        return;
    }

    if (data.length === 0) {
        document.getElementById('gantt-chart').innerHTML = '<p>Nenhuma atividade cadastrada para este empreendimento.</p>';
        return;
    }

    const tasks = data.map(task => ({
        id: task.id.toString(),
        name: task.nome,
        start: task.dataInicio,
        end: task.dataFim,
        progress: task.progresso,
        dependencies: task.dependeDe || ''
    }));

    // Limpa o gantt anterior se existir
    document.getElementById('gantt-chart').innerHTML = '';
    
    gantt = new Gantt("#gantt-chart", tasks, {
        on_date_change: (task, start, end) => {
            // Lógica para salvar a mudança de data (opcional)
            console.log(`Task ${task.name} data alterada para ${start} - ${end}`);
        },
        on_progress_change: (task, progress) => {
            // Lógica para salvar a mudança de progresso (opcional)
             console.log(`Task ${task.name} progresso alterado para ${progress}%`);
        }
    });
}