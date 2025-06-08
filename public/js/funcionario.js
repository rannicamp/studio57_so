// public/js/funcionario.js
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, deleteDoc, where, serverTimestamp, Timestamp, documentId } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
// IMPORTA AS NOVAS FUNÇÕES UTILITÁRIAS DE COMMON.JS
import { showLoading, hideLoading, showToast } from './common.js';

let currentEditId = null; 
let fileRefs = {
    foto: null,
    contrato: null,
    identidade: null,
    aso: null
};
let todosFuncionarios = []; 

export function initializeFuncionarioModule(db, auth, app) {
    const storage = getStorage(app);
    const funcionarioCollectionRef = collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`);

    const funcionarioForm = document.getElementById('employeeForm');
    const feedbackDiv = document.getElementById('feedback-funcionario'); 
    
    const submitBtn = document.getElementById('saveEmployeeBtnFooter'); 
    const cancelEditBtn = document.getElementById('cancelFormBtnFooter'); 
    const clearFormBtn = document.getElementById('clearFormBtn'); 
    
    const formTitle = document.getElementById('formSectionMainTitle'); 

    const formFields = {
        employeeId: document.getElementById('employeeId'), 
        originalCpf: document.getElementById('originalCpf'),
        originalFotoUrl: document.getElementById('originalFotoUrl'),
        originalContratoUrl: document.getElementById('originalContratoUrl'),
        originalIdentidadeUrl: document.getElementById('originalIdentidadeUrl'),
        originalAsoUrl: document.getElementById('originalAsoUrl'),
        nomeCompleto: document.getElementById('nomeCompleto'),
        cpf: document.getElementById('cpf'),
        rg: document.getElementById('rg'),
        dataNascimento: document.getElementById('dataNascimento'),
        email: document.getElementById('email'),
        telefone: document.getElementById('telefone'),
        fotoFuncionarioFile: document.getElementById('fotoFuncionarioFile'),
        photoPreview: document.getElementById('photoPreview'),
        currentPhotoName: document.getElementById('currentPhotoName'),
        currentPhotoLink: document.getElementById('currentPhotoLink'),
        cep: document.getElementById('cep'),
        logradouro: document.getElementById('logradouro'),
        numero: document.getElementById('numero'),
        complemento: document.getElementById('complemento'),
        bairro: document.getElementById('bairro'),
        cidade: document.getElementById('cidade'),
        estado: document.getElementById('estado'),
        cargo: document.getElementById('cargo'),
        dataAdmissao: document.getElementById('dataAdmissao'),
        idRelogioPonto: document.getElementById('idRelogioPonto'),
        observacoes: document.getElementById('observacoes'),
        salarioBase: document.getElementById('salarioBase'),
        valorDia: document.getElementById('valorDia'),
        salarioTotal: document.getElementById('salarioTotal'),
        formaPagamento: document.getElementById('formaPagamento'),
        chavePix: document.getElementById('chavePix'),
        dadosBancarios: document.getElementById('dadosBancarios'),
        chavePixContainer: document.getElementById('chavePixContainer'),
        dadosBancariosContainer: document.getElementById('dadosBancariosContainer'),
        contratoFuncionarioFile: document.getElementById('contratoFuncionarioFile'),
        currentContratoName: document.getElementById('currentContratoName'),
        currentContratoLink: document.getElementById('currentContratoLink'),
        identidadeFuncionarioFile: document.getElementById('identidadeFuncionarioFile'),
        currentIdentidadeName: document.getElementById('currentIdentidadeName'),
        currentIdentidadeLink: document.getElementById('currentIdentidadeLink'),
        asoFuncionarioFile: document.getElementById('asoFuncionarioFile'),
        currentAsoName: document.getElementById('currentAsoName'),
        currentAsoLink: document.getElementById('currentAsoLink'),
        documentosPendentes: document.getElementById('documentosPendentes'),
    };
    
    function getFileNameFromUrl(url) {
        if (!url) return '';
        try {
            const path = new URL(url).pathname;
            const decodedPath = decodeURIComponent(path);
            return decodedPath.substring(decodedPath.lastIndexOf('/') + 1);
        } catch (e) {
            return url.substring(url.lastIndexOf('/') + 1); 
        }
    }

    function resetForm() {
        funcionarioForm.reset();
        currentEditId = null;
        fileRefs = { foto: null, contrato: null, identidade: null, aso: null };

        if (formTitle) formTitle.textContent = 'Novo Funcionário';
        if (submitBtn) {
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = 'Salvar Funcionário';
            else submitBtn.textContent = 'Salvar Funcionário';
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-warning'); 
            submitBtn.classList.add('btn-success-form');
        }
        if (clearFormBtn) clearFormBtn.style.display = 'none'; 
        
        const fileInputsMeta = [
            { key: 'foto', input: formFields.fotoFuncionarioFile, preview: formFields.photoPreview, nameDisplay: formFields.currentPhotoName, link: formFields.currentPhotoLink, originalUrlInput: formFields.originalFotoUrl, defaultPreview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Cpath d='M60,40 C65.5228,40 70,44.4772 70,50 C70,55.5228 65.5228,60 60,60 C54.4772,60 50,55.5228 50,50 C50,44.4772 54.4772,40 60,40 Z M60,65 C73.8071,65 85,76.1929 85,90 L35,90 C35,76.1929 46.1929,65 60,65 Z' fill='%23d1d5db'/%3E%3C/svg%3E" },
            { key: 'contrato', input: formFields.contratoFuncionarioFile, nameDisplay: formFields.currentContratoName, link: formFields.currentContratoLink, originalUrlInput: formFields.originalContratoUrl },
            { key: 'identidade', input: formFields.identidadeFuncionarioFile, nameDisplay: formFields.currentIdentidadeName, link: formFields.currentIdentidadeLink, originalUrlInput: formFields.originalIdentidadeUrl },
            { key: 'aso', input: formFields.asoFuncionarioFile, nameDisplay: formFields.currentAsoName, link: formFields.currentAsoLink, originalUrlInput: formFields.originalAsoUrl }
        ];

        fileInputsMeta.forEach(meta => {
            if (meta.input) meta.input.value = ''; 
            if (meta.preview && meta.defaultPreview) meta.preview.src = meta.defaultPreview;
            else if (meta.preview) meta.preview.src = ''; 
            if (meta.nameDisplay) meta.nameDisplay.textContent = meta.key === 'foto' ? 'Nenhuma foto' : 'Nenhum arquivo';
            if (meta.link) { meta.link.href = '#'; meta.link.style.display = 'none'; }
            if (meta.originalUrlInput) meta.originalUrlInput.value = '';
        });
        
        if (formFields.chavePixContainer) formFields.chavePixContainer.style.display = 'none';
        if (formFields.dadosBancariosContainer) formFields.dadosBancariosContainer.style.display = 'none';
        hideLoading(); 
    }

    function fillFormForEdit(id) {
        const data = todosFuncionarios.find(f => f.id === id);
        if (!data) {
            showToast("error", "Erro", "Funcionário não encontrado para edição.");
            return;
        }

        resetForm(); 
        currentEditId = id;
        if (formFields.employeeId) formFields.employeeId.value = id; 

        if (formTitle) formTitle.textContent = 'Editar Funcionário';
        if (submitBtn) {
             const span = submitBtn.querySelector('span');
            if (span) span.textContent = 'Salvar Edição';
            else submitBtn.textContent = 'Salvar Edição';
            submitBtn.classList.remove('btn-success-form');
            submitBtn.classList.add('btn-warning'); 
        }
        if (clearFormBtn) clearFormBtn.style.display = 'inline-flex'; 
        
        formFields.cpf.value = data.cpf || '';
        formFields.originalCpf.value = data.cpf || '';
        formFields.nomeCompleto.value = data.nomeCompleto || '';
        formFields.rg.value = data.rg || '';
        formFields.dataNascimento.value = data.dataNascimento && data.dataNascimento.seconds ? new Date(data.dataNascimento.seconds * 1000).toISOString().split('T')[0] : '';
        formFields.telefone.value = data.telefone || '';
        formFields.email.value = data.email || '';
        formFields.cep.value = data.cep || '';
        formFields.logradouro.value = data.logradouro || '';
        formFields.numero.value = data.numero || '';
        formFields.complemento.value = data.complemento || '';
        formFields.bairro.value = data.bairro || '';
        formFields.cidade.value = data.cidade || '';
        formFields.estado.value = data.estado || '';
        formFields.cargo.value = data.cargo || '';
        formFields.dataAdmissao.value = data.dataAdmissao && data.dataAdmissao.seconds ? new Date(data.dataAdmissao.seconds * 1000).toISOString().split('T')[0] : '';
        formFields.idRelogioPonto.value = data.idRelogioPonto || '';
        formFields.salarioBase.value = data.salarioBase || '';
        formFields.salarioTotal.value = data.salarioTotal || '';
        formFields.valorDia.value = data.valorDia || '';
        formFields.formaPagamento.value = data.formaPagamento || '';
        formFields.chavePix.value = data.chavePix || '';
        formFields.dadosBancarios.value = data.dadosBancarios || '';
        formFields.documentosPendentes.checked = data.documentosPendentes || false;
        formFields.observacoes.value = data.observacoes || '';

        const fileFieldsData = [
            { key: 'foto', url: data.fotoFuncionarioUrl, input: formFields.fotoFuncionarioFile, preview: formFields.photoPreview, nameDisplay: formFields.currentPhotoName, link: formFields.currentPhotoLink, originalUrlInput: formFields.originalFotoUrl, defaultPreview: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Cpath d='M60,40 C65.5228,40 70,44.4772 70,50 C70,55.5228 65.5228,60 60,60 C54.4772,60 50,55.5228 50,50 C50,44.4772 54.4772,40 60,40 Z M60,65 C73.8071,65 85,76.1929 85,90 L35,90 C35,76.1929 46.1929,65 60,65 Z' fill='%23d1d5db'/%3E%3C/svg%3E" },
            { key: 'contrato', url: data.contratoFuncionarioUrl, input: formFields.contratoFuncionarioFile, nameDisplay: formFields.currentContratoName, link: formFields.currentContratoLink, originalUrlInput: formFields.originalContratoUrl },
            { key: 'identidade', url: data.identidadeFuncionarioUrl, input: formFields.identidadeFuncionarioFile, nameDisplay: formFields.currentIdentidadeName, link: formFields.currentIdentidadeLink, originalUrlInput: formFields.originalIdentidadeUrl },
            { key: 'aso', url: data.asoFuncionarioUrl, input: formFields.asoFuncionarioFile, nameDisplay: formFields.currentAsoName, link: formFields.currentAsoLink, originalUrlInput: formFields.originalAsoUrl }
        ];

        fileFieldsData.forEach(f => {
            if (f.url) {
                if(f.preview) f.preview.src = f.url;
                if(f.nameDisplay) f.nameDisplay.textContent = `Atual: ${getFileNameFromUrl(f.url) || 'Arquivo carregado'}. Para alterar, selecione novo.`;
                if(f.link) { f.link.href = f.url; f.link.style.display = 'inline-block'; }
                if(f.originalUrlInput) f.originalUrlInput.value = f.url;
            } else {
                if(f.preview && f.defaultPreview) f.preview.src = f.defaultPreview;
                else if(f.preview) f.preview.src = '';
                if(f.nameDisplay) f.nameDisplay.textContent = f.key === 'foto' ? 'Nenhuma foto cadastrada.' : 'Nenhum arquivo cadastrado.';
                if(f.link) { f.link.href = '#'; f.link.style.display = 'none'; }
                if(f.originalUrlInput) f.originalUrlInput.value = '';
            }
            fileRefs[f.key] = null; 
        });

        handleFormaPagamentoChange(); 
        showToast('info', 'Edição', 'Você está editando um funcionário. Para alterar arquivos, selecione novos.');
        if (funcionarioForm) window.scrollTo({ top: funcionarioForm.offsetTop, behavior: 'smooth' });
    }

    function handleFormaPagamentoChange() {
        const forma = formFields.formaPagamento.value;
        if(formFields.chavePixContainer) formFields.chavePixContainer.style.display = 'none';
        if(formFields.dadosBancariosContainer) formFields.dadosBancariosContainer.style.display = 'none';
        if (forma === 'PIX' && formFields.chavePixContainer) formFields.chavePixContainer.style.display = 'block';
        else if (forma === 'DEPOSITO_BANCARIO' && formFields.dadosBancariosContainer) formFields.dadosBancariosContainer.style.display = 'block';
    }
    if(formFields.formaPagamento) formFields.formaPagamento.addEventListener('change', handleFormaPagamentoChange);

    function setupFileInputListener(fileInput, fileRefKey, nameDisplay, linkDisplay, previewDisplay, originalUrlInput) {
        if (!fileInput) return;
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileRefs[fileRefKey] = file;
                if (nameDisplay) nameDisplay.textContent = `Novo: ${file.name}`;
                if (linkDisplay) linkDisplay.style.display = 'none';
                if (previewDisplay && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => { previewDisplay.src = ev.target.result; }
                    reader.readAsDataURL(file);
                }
                if (originalUrlInput) originalUrlInput.dataset.newFileSelected = "true";
            } else { 
                fileRefs[fileRefKey] = null;
                const originalUrl = originalUrlInput ? originalUrlInput.value : null;
                if (originalUrl) {
                    if (nameDisplay) nameDisplay.textContent = `Atual: ${getFileNameFromUrl(originalUrl)}. Para alterar, selecione novo.`;
                    if (linkDisplay) { linkDisplay.href = originalUrl; linkDisplay.style.display = 'inline-block'; }
                    if (previewDisplay) previewDisplay.src = originalUrl; 
                } else {
                    if (nameDisplay) nameDisplay.textContent = fileRefKey === 'foto' ? 'Nenhuma foto' : 'Nenhum arquivo';
                    if (linkDisplay) { linkDisplay.href = '#'; linkDisplay.style.display = 'none'; }
                     if (previewDisplay && fileRefKey === 'foto') previewDisplay.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Cpath d='M60,40 C65.5228,40 70,44.4772 70,50 C70,55.5228 65.5228,60 60,60 C54.4772,60 50,55.5228 50,50 C50,44.4772 54.4772,40 60,40 Z M60,65 C73.8071,65 85,76.1929 85,90 L35,90 C35,76.1929 46.1929,65 60,65 Z' fill='%23d1d5db'/%3E%3C/svg%3E";
                }
                if (originalUrlInput) originalUrlInput.dataset.newFileSelected = "false";
            }
        });
    }
    setupFileInputListener(formFields.fotoFuncionarioFile, 'foto', formFields.currentPhotoName, formFields.currentPhotoLink, formFields.photoPreview, formFields.originalFotoUrl);
    setupFileInputListener(formFields.contratoFuncionarioFile, 'contrato', formFields.currentContratoName, formFields.currentContratoLink, null, formFields.originalContratoUrl);
    setupFileInputListener(formFields.identidadeFuncionarioFile, 'identidade', formFields.currentIdentidadeName, formFields.currentIdentidadeLink, null, formFields.originalIdentidadeUrl);
    setupFileInputListener(formFields.asoFuncionarioFile, 'aso', formFields.currentAsoName, formFields.currentAsoLink, null, formFields.originalAsoUrl);

    async function uploadSingleFile(file, pathPrefix, cpf, fieldNameForDisplay, nameDisplayElement) {
        if (!file) return null; 
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const uniqueFileName = `${cpf}_${pathPrefix}_${Date.now()}.${fileExtension}`;
        const storagePath = `funcionarios_documentos/${cpf}/${pathPrefix}/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);

        if (nameDisplayElement) nameDisplayElement.textContent = `Enviando ${fieldNameForDisplay}... 0%`;
        
        const uploadTask = uploadBytesResumable(fileRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (nameDisplayElement) nameDisplayElement.textContent = `Enviando ${fieldNameForDisplay}: ${progress.toFixed(0)}%`;
                },
                (error) => {
                    console.error(`Erro no upload de ${fieldNameForDisplay}:`, error);
                    if (nameDisplayElement) nameDisplayElement.textContent = "Falha no envio.";
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        if (nameDisplayElement) nameDisplayElement.textContent = `${fieldNameForDisplay} enviado!`;
                        resolve(downloadURL);
                    } catch (getUrlError) {
                        console.error(`Erro ao obter URL de ${fieldNameForDisplay}:`, getUrlError);
                        reject(getUrlError);
                    }
                }
            );
        });
    }
    
    async function deleteFileFromStorage(fileURL) {
        if (!fileURL || typeof fileURL !== 'string' || !fileURL.startsWith('https://firebasestorage.googleapis.com/')) {
            return;
        }
        try {
            const fileRefToDelete = ref(storage, fileURL);
            await deleteObject(fileRefToDelete);
            console.log("Arquivo antigo excluído do Storage:", fileURL);
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                console.warn("Arquivo não encontrado no Storage para exclusão (pode já ter sido removido):", fileURL);
            } else {
                console.warn("Erro ao excluir arquivo antigo do Storage:", error, "URL:", fileURL);
            }
        }
    }

    funcionarioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        showLoading();
        
        const originalButtonText = submitBtn ? (submitBtn.querySelector('span') ? submitBtn.querySelector('span').textContent : submitBtn.textContent) : 'Salvar';
        if (submitBtn) {
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = currentEditId ? 'Salvando Edição...' : 'Adicionando Funcionário...';
            else submitBtn.textContent = currentEditId ? 'Salvando Edição...' : 'Adicionando Funcionário...';
        }

        const cpf = formFields.cpf.value.replace(/\D/g, '');
        const nomeCompleto = formFields.nomeCompleto.value;

        if (!cpf || !nomeCompleto) {
            showToast('error', 'Erro de Validação', 'CPF e Nome Completo são obrigatórios.');
            if (submitBtn) {
                submitBtn.disabled = false;
                const span = submitBtn.querySelector('span');
                if (span) span.textContent = originalButtonText; else submitBtn.textContent = originalButtonText;
            }
            hideLoading();
            return;
        }
        
        let urlsToSave = {
            fotoFuncionarioUrl: formFields.originalFotoUrl.value || null,
            contratoFuncionarioUrl: formFields.originalContratoUrl.value || null,
            identidadeFuncionarioUrl: formFields.originalIdentidadeUrl.value || null,
            asoFuncionarioUrl: formFields.originalAsoUrl.value || null,
        };

        try {
            const filesToUploadConfig = [
                { key: 'foto', file: fileRefs.foto, path: 'foto', name: 'Foto', displayEl: formFields.currentPhotoName, originalUrlField: formFields.originalFotoUrl },
                { key: 'contrato', file: fileRefs.contrato, path: 'contrato', name: 'Contrato', displayEl: formFields.currentContratoName, originalUrlField: formFields.originalContratoUrl },
                { key: 'identidade', file: fileRefs.identidade, path: 'identidade', name: 'Identidade', displayEl: formFields.currentIdentidadeName, originalUrlField: formFields.originalIdentidadeUrl },
                { key: 'aso', file: fileRefs.aso, path: 'aso', name: 'ASO', displayEl: formFields.currentAsoName, originalUrlField: formFields.originalAsoUrl }
            ];

            for (const config of filesToUploadConfig) {
                if (config.file) { 
                    showToast('info', 'Upload', `Iniciando upload de ${config.name}...`);
                    const newUrl = await uploadSingleFile(config.file, config.path, cpf, config.name, config.displayEl);
                    if (newUrl) {
                        const oldUrl = config.originalUrlField.value;
                        if (oldUrl && oldUrl !== newUrl) { 
                           await deleteFileFromStorage(oldUrl);
                        }
                        urlsToSave[`${config.key}FuncionarioUrl`] = newUrl;
                         config.originalUrlField.value = newUrl; 
                    } else {
                        throw new Error(`Falha ao obter URL para ${config.name}`);
                    }
                }
            }
            await salvarDadosFuncionario(urlsToSave);

        } catch (error) {
            console.error("Erro durante o processo de submissão:", error);
            showToast('error', 'Erro Crítico', `Erro ao processar formulário: ${error.message}`);
            if (submitBtn) {
                submitBtn.disabled = false;
                 const span = submitBtn.querySelector('span');
                if (span) span.textContent = originalButtonText; else submitBtn.textContent = originalButtonText;
            }
            hideLoading();
        }
    });

    async function salvarDadosFuncionario(uploadedFileUrls) {
        const cpf = formFields.cpf.value.replace(/\D/g, '');
        
        const funcionarioData = {
            cpf: cpf,
            nomeCompleto: formFields.nomeCompleto.value,
            rg: formFields.rg.value,
            dataNascimento: formFields.dataNascimento.value ? Timestamp.fromDate(new Date(formFields.dataNascimento.value + 'T00:00:00')) : null,
            telefone: formFields.telefone.value,
            email: formFields.email.value,
            cep: formFields.cep.value,
            logradouro: formFields.logradouro.value,
            numero: formFields.numero.value,
            complemento: formFields.complemento.value,
            bairro: formFields.bairro.value,
            cidade: formFields.cidade.value,
            estado: formFields.estado.value,
            cargo: formFields.cargo.value,
            dataAdmissao: formFields.dataAdmissao.value ? Timestamp.fromDate(new Date(formFields.dataAdmissao.value + 'T00:00:00')) : null,
            idRelogioPonto: formFields.idRelogioPonto.value,
            salarioBase: formFields.salarioBase.value,
            salarioTotal: formFields.salarioTotal.value,
            valorDia: formFields.valorDia.value,
            formaPagamento: formFields.formaPagamento.value,
            chavePix: formFields.chavePix.value,
            dadosBancarios: formFields.dadosBancarios.value,
            documentosPendentes: formFields.documentosPendentes.checked,
            observacoes: formFields.observacoes.value,
            fotoFuncionarioUrl: uploadedFileUrls.fotoFuncionarioUrl,
            contratoFuncionarioUrl: uploadedFileUrls.contratoFuncionarioUrl,
            identidadeFuncionarioUrl: uploadedFileUrls.identidadeFuncionarioUrl,
            asoFuncionarioUrl: uploadedFileUrls.asoFuncionarioUrl,
            updatedAt: serverTimestamp()
        };

        if (!currentEditId) {
            funcionarioData.createdAt = serverTimestamp();
        }

        try {
            if (currentEditId) { 
                if (cpf !== formFields.originalCpf.value) { 
                     const existingDocs = await getDocs(query(funcionarioCollectionRef, where('cpf', '==', cpf)));
                     if (!existingDocs.empty) {
                         showToast('error', 'Erro de Duplicidade', 'Erro: Já existe um funcionário com este novo CPF cadastrado.');
                         if(submitBtn) submitBtn.disabled = false;
                         hideLoading();
                         return;
                     }
                }
                const docRef = doc(db, `artifacts/${APP_COLLECTION_ID}/funcionario`, currentEditId);
                await setDoc(docRef, funcionarioData, { merge: true });
                showToast('success', 'Sucesso', 'Funcionário atualizado com sucesso!');
            } else { 
                const existingDocs = await getDocs(query(funcionarioCollectionRef, where('cpf', '==', cpf)));
                if (!existingDocs.empty) {
                    showToast('error', 'Erro de Duplicidade', 'Erro: Já existe um funcionário com este CPF cadastrado.');
                    if(submitBtn) submitBtn.disabled = false;
                     hideLoading();
                    return;
                }
                await addDoc(funcionarioCollectionRef, funcionarioData);
                showToast('success', 'Sucesso', 'Funcionário adicionado com sucesso!');
            }
            resetForm();
        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            showToast('error', 'Erro no Firestore', `Erro ao salvar funcionário: ${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                const span = submitBtn.querySelector('span');
                 if(span && (span.textContent.includes('Salvando') || span.textContent.includes('Adicionando'))) {
                    span.textContent = currentEditId ? 'Salvar Edição' : 'Salvar Funcionário';
                 } else if (submitBtn.textContent.includes('Salvando') || submitBtn.textContent.includes('Adicionando')) {
                    submitBtn.textContent = currentEditId ? 'Salvar Edição' : 'Salvar Funcionário';
                 }
            }
            hideLoading();
        }
    }

    if(cancelEditBtn) cancelEditBtn.addEventListener('click', () => {if(confirm('Deseja limpar o formulário e cancelar a edição?')) resetForm(); });
    if(clearFormBtn) clearFormBtn.addEventListener('click', () => {if(confirm('Deseja limpar o formulário e cancelar a edição?')) resetForm(); });

    async function loadFuncionarios() { 
        showLoading();
        let q = query(funcionarioCollectionRef, orderBy('nomeCompleto'));
        todosFuncionarios = [];
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                todosFuncionarios.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error("Erro ao carregar funcionários para edição:", error);
            showToast('error', 'Erro de Carregamento', `Erro ao carregar dados de funcionários: ${error.message}`);
        } finally {
            hideLoading();
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const editIdFromUrl = urlParams.get('editId');

    if (editIdFromUrl) {
        showToast("info", "Carregando...", "Carregando dados do funcionário para edição...");
        loadFuncionarios().then(() => { 
            fillFormForEdit(editIdFromUrl);
        });
    } else {
        resetForm(); 
    }
}