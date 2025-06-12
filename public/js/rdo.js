// public/js/rdo.js

import { collection, addDoc, getDocs, getDoc, query, where, doc, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

export function initializeRdoModule(db, storage, user) {
    const rdoForm = document.getElementById('rdoForm');
    if (!rdoForm) return;

    // Elementos do DOM
    const selectEmpreendimento = document.getElementById('select-empreendimento-rdo');
    const dataRelatorioInput = document.getElementById('dataRelatorio');
    const maoDeObraContainer = document.getElementById('maoDeObraContainer');
    const atividadesContainer = document.getElementById('atividadesContainer');
    const photoUploadContainer = document.getElementById('dynamic-photo-upload-container');

    let photoEntries = 0;

    // --- CARREGAMENTO DE DADOS INICIAIS ---
    async function loadEmpreendimentos() {
        try {
            const q = query(collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`), orderBy("nomeEmpreendimento"));
            const snapshot = await getDocs(q);
            selectEmpreendimento.innerHTML = '<option value="">Selecione um Empreendimento</option>';
            snapshot.forEach(doc => {
                selectEmpreendimento.add(new Option(doc.data().nomeEmpreendimento, doc.id));
            });

            // Seleciona empreendimento se vier pela URL
            const urlParams = new URLSearchParams(window.location.search);
            const empreendimentoId = urlParams.get('empreendimentoId');
            if (empreendimentoId) {
                selectEmpreendimento.value = empreendimentoId;
                selectEmpreendimento.dispatchEvent(new Event('change'));
            }

        } catch (error) {
            showToast('error', 'Erro', 'Falha ao carregar empreendimentos.');
            console.error("Erro ao carregar empreendimentos:", error);
        }
    }

    async function onEmpreendimentoChange() {
        const empreendimentoId = selectEmpreendimento.value;
        if (!empreendimentoId) {
            maoDeObraContainer.innerHTML = '';
            atividadesContainer.innerHTML = '';
            return;
        }
        showLoading();
        await loadMaoDeObra(empreendimentoId);
        await loadAtividades(empreendimentoId);
        hideLoading();
    }

    async function loadMaoDeObra(empreendimentoId) {
        try {
            const q = query(collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`), where("empreendimentoId", "==", empreendimentoId), orderBy("nomeCompleto"));
            const snapshot = await getDocs(q);
            maoDeObraContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const funcionario = { id: doc.id, ...doc.data() };
                const row = createMaoDeObraRow(funcionario);
                maoDeObraContainer.appendChild(row);
            });
        } catch (error) {
            showToast('error', 'Erro', 'Falha ao carregar mão de obra.');
            console.error("Erro ao carregar mão de obra:", error);
        }
    }
    
    async function loadAtividades(empreendimentoId) {
        try {
            const empreendimentoDoc = await getDoc(doc(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`, empreendimentoId));
            if (empreendimentoDoc.exists()) {
                const atividades = empreendimentoDoc.data().areas || [];
                atividadesContainer.innerHTML = '';
                atividades.forEach(atividade => {
                    const row = createAtividadeRow(atividade);
                    atividadesContainer.appendChild(row);
                });
            }
        } catch (error) {
            showToast('error', 'Erro', 'Falha ao carregar atividades do cronograma.');
            console.error("Erro ao carregar atividades:", error);
        }
    }

    // --- CRIAÇÃO DE ELEMENTOS DINÂMICOS ---
    function createMaoDeObraRow(funcionario) {
        const div = document.createElement('div');
        div.className = 'rdo-list-row';
        div.dataset.id = funcionario.id;
        div.innerHTML = `
            <span class="item-name"><i class="fas fa-user fa-fw"></i> ${funcionario.nomeCompleto}</span>
            <div class="item-actions">
                <button type="button" class="btn-attendance present" data-status="presente">Presente</button>
                <button type="button" class="btn-attendance absent" data-status="falta">Falta</button>
            </div>
        `;
        div.querySelectorAll('.btn-attendance').forEach(btn => {
            btn.addEventListener('click', () => {
                div.querySelectorAll('.btn-attendance').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                div.dataset.status = btn.dataset.status;
            });
        });
        return div;
    }

    function createAtividadeRow(atividade) {
        const div = document.createElement('div');
        div.className = 'rdo-list-row';
        div.dataset.id = atividade.id;
        div.innerHTML = `
            <span class="item-name"><i class="fas fa-tasks fa-fw"></i> ${atividade.nome}</span>
            <div class="item-actions">
                <select class="status-select">
                    <option value="não iniciado">Não Iniciado</option>
                    <option value="em andamento">Em Andamento</option>
                    <option value="concluído">Concluído</option>
                    <option value="paralisado">Paralisado</option>
                </select>
            </div>
        `;
        return div;
    }

    function addPhotoEntry() {
        photoEntries++;
        const id = photoEntries;
        const div = document.createElement('div');
        div.className = 'photo-upload-entry';
        div.id = `photo-entry-${id}`;
        div.innerHTML = `
            <label for="photo-file-${id}" class="photo-upload-preview" id="photo-preview-${id}"></label>
            <input type="file" id="photo-file-${id}" class="hidden" accept="image/*" data-entry-id="${id}">
            <div class="photo-upload-details">
                <label for="photo-desc-${id}" class="form-label" style="margin-bottom: 0.25rem;">Descrição da Foto</label>
                <input type="text" id="photo-desc-${id}" class="form-control" placeholder="Ex: Início da concretagem da laje">
            </div>
            <button type="button" class="btn btn-danger-form btn-sm remove-photo-btn" data-entry-id="${id}"><i class="fas fa-trash-alt"></i></button>
        `;
        photoUploadContainer.appendChild(div);

        document.getElementById(`photo-file-${id}`).addEventListener('change', handlePhotoPreview);
        div.querySelector('.remove-photo-btn').addEventListener('click', () => div.remove());
    }

    function handlePhotoPreview(event) {
        const input = event.target;
        const entryId = input.dataset.entryId;
        const preview = document.getElementById(`photo-preview-${entryId}`);
        const file = input.files[0];
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.style.backgroundImage = `url('${e.target.result}')`;
            };
            reader.readAsDataURL(file);
        }
    }

    // --- SUBMISSÃO DO FORMULÁRIO ---
    async function onFormSubmit(e) {
        e.preventDefault();
        showLoading();

        const empreendimentoId = selectEmpreendimento.value;
        const dataRelatorio = dataRelatorioInput.value;
        if (!empreendimentoId || !dataRelatorio) {
            showToast('error', 'Campos Obrigatórios', 'Selecione um empreendimento e a data do relatório.');
            hideLoading();
            return;
        }

        try {
            // Coleta de dados
            const maoDeObra = getMaoDeObraData();
            const statusAtividades = getAtividadesData();
            const fotos = await uploadPhotos(empreendimentoId, dataRelatorio);

            // Monta o objeto RDO
            const rdoData = {
                empreendimentoId,
                empreendimentoNome: selectEmpreendimento.options[selectEmpreendimento.selectedIndex].text,
                dataRelatorio: Timestamp.fromDate(new Date(dataRelatorio + 'T12:00:00')), // Salva com meio-dia para evitar problemas de fuso
                condicoesClimaticas: Array.from(document.querySelectorAll('input[name="cond-clima"]:checked')).map(el => el.value),
                condicoesTrabalho: Array.from(document.querySelectorAll('input[name="cond-trabalho"]:checked')).map(el => el.value),
                maoDeObra,
                statusAtividades,
                fotos,
                observacoes: document.getElementById('observacoesRdo').value,
                responsavelRdo: { id: user.uid, email: user.email, nome: user.displayName || user.email },
                createdAt: serverTimestamp()
            };
            
            // Salva no Firestore
            await addDoc(collection(db, `artifacts/${APP_COLLECTION_ID}/rdo`), rdoData);

            showToast('success', 'Sucesso!', 'Relatório Diário de Obra salvo com sucesso.');
            rdoForm.reset();
            maoDeObraContainer.innerHTML = '';
            atividadesContainer.innerHTML = '';
            photoUploadContainer.innerHTML = '';
            photoEntries = 0;
            addPhotoEntry();

        } catch (error) {
            showToast('error', 'Erro Crítico', 'Não foi possível salvar o RDO.');
            console.error("Erro ao salvar RDO:", error);
        } finally {
            hideLoading();
        }
    }

    function getMaoDeObraData() {
        return Array.from(maoDeObraContainer.querySelectorAll('.rdo-list-row')).map(row => ({
            id: row.dataset.id,
            nome: row.querySelector('.item-name').textContent.trim(),
            status: row.dataset.status || 'falta'
        }));
    }

    function getAtividadesData() {
        return Array.from(atividadesContainer.querySelectorAll('.rdo-list-row')).map(row => ({
            id: row.dataset.id,
            nome: row.querySelector('.item-name').textContent.trim(),
            status: row.querySelector('.status-select').value
        }));
    }

    async function uploadPhotos(empreendimentoId, data) {
        const uploadedPhotos = [];
        const photoInputs = document.querySelectorAll('.photo-upload-entry input[type="file"]');
        for (const input of photoInputs) {
            if (input.files.length > 0) {
                const file = input.files[0];
                const entryId = input.dataset.entryId;
                const description = document.getElementById(`photo-desc-${entryId}`).value;
                const filePath = `rdo_fotos/${empreendimentoId}/${data}_${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filePath);
                
                const uploadTask = await uploadBytesResumable(storageRef, file);
                const downloadURL = await getDownloadURL(uploadTask.ref);
                
                uploadedPhotos.push({
                    url: downloadURL,
                    path: filePath,
                    description: description,
                    timestamp: serverTimestamp()
                });
            }
        }
        return uploadedPhotos;
    }

    // --- INICIALIZAÇÃO ---
    selectEmpreendimento.addEventListener('change', onEmpreendimentoChange);
    document.getElementById('add-photo-btn').addEventListener('click', addPhotoEntry);
    rdoForm.addEventListener('submit', onFormSubmit);
    
    // Configura data padrão para hoje
    dataRelatorioInput.value = new Date().toISOString().split('T')[0];
    
    loadEmpreendimentos();
    addPhotoEntry(); // Adiciona a primeira entrada de foto
}