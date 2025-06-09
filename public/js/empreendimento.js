import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

function applyCepMask(e) {
    e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
}

export function initializeEmpreendimentoModule(db) {
    const empreendimentoForm = document.getElementById('empreendimentoForm');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelFormBtn');
    const cepInput = document.getElementById('cep');
    const addPavementBtn = document.getElementById('add-pavement-btn');
    const areaTableBody = document.getElementById('area-table-body');

    // Mapeamento dos IDs dos campos estáticos
    const fieldIds = [
        "nomeEmpreendimento", "usoImovel", "descricaoProjeto",
        "cep", "logradouro", "numero", "bairro", "cidade", "estado",
        "lote", "quadra", "zona", "via", "areaTerreno",
        "proprietarioNome", "proprietarioCpfCnpj", "responsavelTecnicoNome", "cauCrea",
        "numPavimentos", "coefAproveitamento", "taxaPermeabilidade", "unidadesResidenciais",
        "unidadesNaoResidenciais", "vagasEstacionamento", "observacoesEdificacao",
        "statusAprovacao", "dataAprovacao", "numProcesso", "responsavelAprovacao"
    ];

    // --- LÓGICA DA TABELA DE ÁREAS ---
    
    function createAreaRow(pavimento = '', area = '') {
        const row = document.createElement('div');
        row.className = 'area-table-row';
        row.innerHTML = `
            <div class="area-table-cell">
                <input type="text" class="form-control pavement-name" placeholder="Ex: Térreo" value="${pavimento}">
            </div>
            <div class="area-table-cell">
                <input type="number" class="form-control pavement-area" placeholder="0.00" step="0.01" value="${area}">
            </div>
            <div class="area-table-cell area-table-actions">
                <button type="button" class="btn-action move-up" title="Mover para Cima"><i class="fas fa-arrow-up"></i></button>
                <button type="button" class="btn-action move-down" title="Mover para Baixo"><i class="fas fa-arrow-down"></i></button>
                <button type="button" class="btn-action delete" title="Excluir"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        areaTableBody.appendChild(row);
    }

    areaTableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-action');
        if (!target) return;

        const row = target.closest('.area-table-row');

        if (target.classList.contains('delete')) {
            if (confirm('Tem certeza que deseja excluir este pavimento?')) {
                row.remove();
            }
        } else if (target.classList.contains('move-up')) {
            const prevRow = row.previousElementSibling;
            if (prevRow) {
                areaTableBody.insertBefore(row, prevRow);
            }
        } else if (target.classList.contains('move-down')) {
            const nextRow = row.nextElementSibling;
            if (nextRow) {
                areaTableBody.insertBefore(nextRow, row);
            }
        }
    });

    addPavementBtn.addEventListener('click', () => createAreaRow());
    
    // Inicializa com algumas linhas padrão
    createAreaRow('Térreo');

    // --- LÓGICA DO FORMULÁRIO (CEP e SUBMIT) ---

    // CORREÇÃO: Função de busca de CEP foi implementada corretamente
    async function fetchAddressFromCEP(cepValue) {
        const cleanCep = cepValue.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            return; // Sai se o CEP não tiver 8 dígitos
        }

        showLoading();
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (!response.ok) {
                throw new Error('Falha na resposta da API');
            }
            
            const data = await response.json();
            if (data.erro) {
                showToast('warning', 'CEP não encontrado', 'Verifique o CEP digitado e tente novamente.');
            } else {
                // Preenche os campos de endereço
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
                document.getElementById('numero').focus(); // Coloca o cursor no campo de número
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            showToast('error', 'Erro na Busca', 'Não foi possível buscar o endereço. Tente preencher manualmente.');
        } finally {
            hideLoading();
        }
    }
    
    cepInput.addEventListener('input', applyCepMask);
    cepInput.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));

    empreendimentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        saveBtn.disabled = true;

        const empreendimentoData = {};
        // Coleta dados dos campos estáticos
        fieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const value = element.value;
                if (element.type === 'number') {
                    empreendimentoData[id] = value ? Number(value) : null;
                } else if(element.type === 'date') {
                    empreendimentoData[id] = value || null;
                } else {
                    empreendimentoData[id] = value;
                }
            }
        });

        // Coleta dados da tabela de áreas dinâmica
        const quadroDeAreas = [];
        const areaRows = areaTableBody.querySelectorAll('.area-table-row');
        areaRows.forEach(row => {
            const nome = row.querySelector('.pavement-name').value;
            const area = row.querySelector('.pavement-area').value;
            if (nome && area) { // Salva apenas se ambos os campos estiverem preenchidos
                quadroDeAreas.push({ pavimento: nome, area: Number(area) });
            }
        });
        empreendimentoData.quadroDeAreas = quadroDeAreas;

        empreendimentoData.criadoEm = serverTimestamp();
        empreendimentoData.atualizadoEm = serverTimestamp();

        try {
            const empreendimentosRef = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);
            await addDoc(empreendimentosRef, empreendimentoData);
            
            showToast('success', 'Sucesso!', 'Empreendimento cadastrado com sucesso.');
            empreendimentoForm.reset();
            areaTableBody.innerHTML = ''; // Limpa a tabela
            createAreaRow('Térreo'); // Adiciona a linha inicial de volta
            document.querySelector('.tab[data-tab="geral"]')?.click();
             
        } catch (error) {
            console.error("Erro ao salvar empreendimento:", error);
            showToast('error', 'Erro', 'Não foi possível salvar os dados. Tente novamente.');
        } finally {
            hideLoading();
            saveBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todos os campos?')) {
            empreendimentoForm.reset();
            areaTableBody.innerHTML = '';
            createAreaRow('Térreo');
        }
    });
}
