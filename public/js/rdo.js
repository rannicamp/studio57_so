// public/js/rdo.js (VERSÃO FINAL E FUNCIONAL)
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

export function initializeRdoModule(db, storage, user) {
    const rdoForm = document.getElementById('rdoForm');
    const selectEmpreendimento = document.getElementById('select-empreendimento');
    const employeeListContainer = document.getElementById('employee-list-container');
    const ganttActivitiesContainer = document.getElementById('gantt-activities-container');
    const rdoDateField = document.getElementById('rdo-date');
    
    const photoUploadSection = {
        container: document.getElementById('dynamic-photo-upload-container'),
        addBtn: document.getElementById('add-photo-btn')
    };

    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelFormBtn');
    
    // Mapeamento dos elementos do cabeçalho de informações
    const headerInfo = {
        container: document.getElementById('rdo-header-info'),
        nomeObra: document.getElementById('header-nome-obra'),
        enderecoObra: document.getElementById('header-endereco-obra'),
        dataInicio: document.getElementById('header-data-inicio'),
        dataFim: document.getElementById('header-data-fim'),
        diasCorridos: document.getElementById('header-dias-corridos'),
        responsavel: document.getElementById('header-responsavel')
    };
    
    // --- CARREGAMENTO DE DADOS ---
    
    async function loadEmpreendimentos() {
        selectEmpreendimento.innerHTML = '<option value="">A carregar...</option>';
        try {
            const empreendimentosRef = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);
            const snapshot = await getDocs(query(empreendimentosRef));
            
            if (snapshot.empty) {
                selectEmpreendimento.innerHTML = '<option value="">Nenhum empreendimento registado</option>';
                return;
            }
            
            const empreendimentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            empreendimentos.sort((a, b) => (a.nomeEmpreendimento || '').localeCompare(b.nomeEmpreendimento || ''));

            selectEmpreendimento.innerHTML = '<option value="">Selecione uma obra</option>';
            empreendimentos.forEach((data) => {
                const opt = document.createElement("option");
                opt.value = data.id;
                opt.textContent = data.nomeEmpreendimento || "Empreendimento sem nome";
                selectEmpreendimento.appendChild(opt);
            });
        } catch (error) {
            console.error("Erro ao carregar empreendimentos:", error);
            showToast('error', 'Erro de Rede', 'Não foi possível carregar os empreendimentos.');
            selectEmpreendimento.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    async function loadFuncionariosDoEmpreendimento(empreendimentoId) {
        employeeListContainer.innerHTML = '<p>A carregar funcionários...</p>';
        try {
            const funcionariosRef = collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`);
            const q = query(funcionariosRef, where("empreendimentoId", "==", empreendimentoId));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                employeeListContainer.innerHTML = '<p>Nenhum funcionário alocado para este empreendimento.</p>';
                return;
            }

            const funcionarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            funcionarios.sort((a, b) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''));

            employeeListContainer.innerHTML = '';
            funcionarios.forEach((funcionario) => {
                const row = document.createElement('div');
                row.className = 'rdo-list-row';
                row.dataset.employeeId = funcionario.id;
                row.dataset.employeeName = funcionario.nomeCompleto || 'Nome não informado';
                row.innerHTML = `
                    <span class="item-name">${funcionario.nomeCompleto || 'Nome não informado'}</span>
                    <div class="item-actions">
                        <button type="button" class="btn-attendance present" data-status="presente">Presente</button>
                        <button type="button" class="btn-attendance absent" data-status="falta">Falta</button>
                    </div>
                `;
                employeeListContainer.appendChild(row);
            });

        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            showToast('error', 'Erro de Rede', 'Não foi possível carregar a lista de funcionários.');
            employeeListContainer.innerHTML = '<p>Erro ao carregar funcionários.</p>';
        }
    }

    async function loadAtividadesEmAndamento(empreendimentoId, dataRdo) {
        ganttActivitiesContainer.innerHTML = '<p>A carregar atividades do cronograma...</p>';
        const dataSelecionada = new Date(dataRdo + 'T00:00:00');

        try {
            const atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
            const q = query(atividadesRef, where("empreendimentoId", "==", empreendimentoId));
            const snapshot = await getDocs(q);

            const atividadesVigentes = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(atividade => {
                    if (atividade.dataInicio && atividade.dataFim) {
                        const inicio = atividade.dataInicio.toDate();
                        const fim = atividade.dataFim.toDate();
                        return dataSelecionada >= inicio && dataSelecionada <= fim;
                    }
                    return false;
                });

            if (atividadesVigentes.length === 0) {
                ganttActivitiesContainer.innerHTML = '<p>Nenhuma atividade do cronograma em andamento para esta data.</p>';
                return;
            }
            
            atividadesVigentes.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

            ganttActivitiesContainer.innerHTML = '';
            atividadesVigentes.forEach(atividade => {
                 const row = document.createElement('div');
                row.className = 'rdo-list-row';
                row.dataset.activityId = atividade.id;
                row.dataset.activityName = atividade.nome || 'Atividade sem nome';
                row.innerHTML = `
                    <span class="item-name">${atividade.nome || 'Atividade sem nome'}</span>
                    <div class="item-actions">
                        <select class="status-select form-control">
                            <option value="não iniciado">Não Iniciado</option>
                            <option value="em andamento" selected>Em Andamento</option>
                            <option value="paralisado">Paralisado</option>
                            <option value="concluído">Concluído</option>
                        </select>
                    </div>
                `;
                ganttActivitiesContainer.appendChild(row);
            });

        } catch (error) {
             console.error("Erro ao carregar atividades do cronograma:", error);
             showToast('error', 'Erro de Rede', 'Não foi possível carregar as atividades.');
             ganttActivitiesContainer.innerHTML = '<p>Erro ao carregar atividades.</p>';
        }
    }
    
    async function loadEmpreendimentoDetails(empreendimentoId) {
        // Esta função foi removida porque os elementos do cabeçalho não existem no rdo.html
        // Se precisar adicionar um cabeçalho dinâmico no futuro, a lógica pode ser reintroduzida.
    }

    // --- LÓGICA DE FOTOS DINÂMICAS ---
    function createPhotoUploadEntry() {
        const entryId = `photo-entry-${Date.now()}`;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'photo-upload-entry';
        entryDiv.id = entryId;
        
        entryDiv.innerHTML = `
            <label for="file-${entryId}" class="photo-upload-preview"></label>
            <input type="file" id="file-${entryId}" class="photo-file-input" accept="image/*" style="display: none;">
            <div class="photo-upload-details">
                <label for="desc-${entryId}" class="form-label" style="margin-bottom: 0.25rem;">Descrição da Foto:</label>
                <textarea id="desc-${entryId}" class="form-control photo-desc-input" rows="3" placeholder="Descreva o que a foto mostra..."></textarea>
            </div>
            <button type="button" class="btn btn-danger-form remove-photo-btn" style="height: fit-content;"><i class="fas fa-trash-alt"></i></button>
        `;
        
        photoUploadSection.container.appendChild(entryDiv);

        const fileInput = entryDiv.querySelector('.photo-file-input');
        const preview = entryDiv.querySelector('.photo-upload-preview');
        preview.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.style.backgroundImage = `url('${event.target.result}')`;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        entryDiv.querySelector('.remove-photo-btn').addEventListener('click', () => {
            if (confirm('Tem a certeza que quer remover esta foto?')) {
                entryDiv.remove();
            }
        });
    }

    // --- LÓGICA DO FORMULÁRIO ---
    rdoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        saveBtn.disabled = true;

        const empreendimentoId = selectEmpreendimento.value;
        if (!empreendimentoId) {
             showToast('error', 'Seleção Necessária', 'Por favor, selecione um empreendimento primeiro.');
             hideLoading();
             saveBtn.disabled = false;
             return;
        }

        const empreendimentoNome = selectEmpreendimento.options[selectEmpreendimento.selectedIndex].text;
        const clima = Array.from(document.querySelectorAll('#weather-conditions .form-check-input:checked')).map(cb => cb.value);
        const condicaoTrabalho = document.querySelector('input[name="work-condition"]:checked')?.value || 'não informado';
        const maoDeObra = Array.from(document.querySelectorAll('#employee-list-container .rdo-list-row')).map(row => ({
                id: row.dataset.employeeId,
                nome: row.dataset.employeeName,
                status: row.dataset.status || 'não informado'
            }));
        const statusAtividades = Array.from(document.querySelectorAll('#gantt-activities-container .rdo-list-row')).map(row => ({
                id: row.dataset.activityId,
                nome: row.dataset.activityName,
                status: row.querySelector('.status-select').value
            }));

        const photoEntries = photoUploadSection.container.querySelectorAll('.photo-upload-entry');
        const photoUploadPromises = Array.from(photoEntries).map(async (entry) => {
            const fileInput = entry.querySelector('.photo-file-input');
            const description = entry.querySelector('.photo-desc-input').value;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const uniqueFileName = `${Date.now()}-${file.name}`;
                const storageRef = ref(storage, `rdo_photos/${empreendimentoId}/${uniqueFileName}`);
                const snapshot = await uploadBytesResumable(storageRef, file);
                const url = await getDownloadURL(snapshot.ref);
                return { url, description };
            }
            return null;
        });

        const fotos = (await Promise.all(photoUploadPromises)).filter(p => p !== null);

        const rdoData = {
            empreendimentoId, empreendimentoNome,
            dataRelatorio: new Date(rdoDateField.value + 'T00:00:00'),
            condicoesClimaticas: clima, condicoesTrabalho: condicaoTrabalho, maoDeObra,
            statusAtividades,
            ocorrencias: document.getElementById('observations').value,
            fotos,
            responsavelRdo: { uid: user.uid, nome: user.displayName || user.email },
            criadoEm: serverTimestamp()
        };

        try {
            await addDoc(collection(db, `artifacts/${APP_COLLECTION_ID}/rdo`), rdoData);
            showToast('success', 'Sucesso!', 'RDO guardado com sucesso.');
            rdoForm.reset();
            photoUploadSection.container.innerHTML = '';
            employeeListContainer.innerHTML = '<p>Selecione um empreendimento para ver os funcionários.</p>';
            ganttActivitiesContainer.innerHTML = '<p>Selecione um empreendimento e uma data.</p>';
            rdoDateField.value = new Date().toISOString().split('T')[0];
        } catch (error) {
            console.error("Erro ao guardar RDO: ", error);
            showToast('error', 'Erro ao Guardar', 'Não foi possível registar o RDO.');
        } finally {
            hideLoading();
            saveBtn.disabled = false;
        }
    });
    
    // --- EVENT LISTENERS ---
    function handleSelectionChange() {
        const empreendimentoId = selectEmpreendimento.value;
        const rdoDate = rdoDateField.value;

        if (empreendimentoId) {
            loadFuncionariosDoEmpreendimento(empreendimentoId);
            if (rdoDate) {
                loadAtividadesEmAndamento(empreendimentoId, rdoDate);
            }
        } else {
            employeeListContainer.innerHTML = '<p>Selecione um empreendimento para ver os funcionários.</p>';
            ganttActivitiesContainer.innerHTML = '<p>Selecione um empreendimento e uma data.</p>';
        }
    }

    selectEmpreendimento.addEventListener('change', handleSelectionChange);
    rdoDateField.addEventListener('change', handleSelectionChange);
    
    // CORREÇÃO: a variável addPhotoBtn foi trocada por photoUploadSection.addBtn
    photoUploadSection.addBtn.addEventListener('click', createPhotoUploadEntry);

    employeeListContainer.addEventListener('click', e => {
        if(e.target.classList.contains('btn-attendance')) {
            const row = e.target.closest('.rdo-list-row');
            row.querySelectorAll('.btn-attendance').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            row.dataset.status = e.target.dataset.status;
        }
    });
    cancelBtn.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja limpar todos os campos?')) {
            rdoForm.reset();
            photoUploadSection.container.innerHTML = '';
            rdoDateField.value = new Date().toISOString().split('T')[0];
        }
    });

    // --- INICIALIZAÇÃO DA PÁGINA ---
    rdoDateField.value = new Date().toISOString().split('T')[0];
    loadEmpreendimentos();
}