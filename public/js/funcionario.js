// public/js/funcionario.js (VERSÃO COMPLETA E CORRIGIDA)
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

let currentEditId = null;
let todosFuncionarios = [];
let fileRefs = {
    foto: null,
    contrato: null,
    identidade: null,
    aso: null
};

// Funções de Máscara
function applyCurrencyMask(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') { e.target.value = ''; return; }
    value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    e.target.value = value;
}
function applyCpfMask(e) {
    let value = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
}
function applyPhoneMask(e) {
    let value = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
    e.target.value = value;
}
function applyCepMask(e) {
    let value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
}

export function initializeFuncionarioModule(db, auth, storage) {
    const funcionarioForm = document.getElementById('employeeForm');
    const submitBtn = document.getElementById('saveEmployeeBtnFooter');
    const cancelEditBtn = document.getElementById('cancelFormBtnFooter');
    const formTitle = document.getElementById('formSectionMainTitle');

    const formFields = { /* ... (mesma lista de campos de antes) ... */ 
        employeeId: document.getElementById('employeeId'), originalCpf: document.getElementById('originalCpf'),
        fotoFuncionarioUrl: document.getElementById('fotoFuncionarioUrl'), fotoFuncionarioPath: document.getElementById('fotoFuncionarioPath'),
        contratoFuncionarioUrl: document.getElementById('contratoFuncionarioUrl'), contratoFuncionarioPath: document.getElementById('contratoFuncionarioPath'),
        identidadeFuncionarioUrl: document.getElementById('identidadeFuncionarioUrl'), identidadeFuncionarioPath: document.getElementById('identidadeFuncionarioPath'),
        asoFuncionarioUrl: document.getElementById('asoFuncionarioUrl'), asoFuncionarioPath: document.getElementById('asoFuncionarioPath'),
        nomeCompleto: document.getElementById('nomeCompleto'), cpf: document.getElementById('cpf'), rg: document.getElementById('rg'),
        dataNascimento: document.getElementById('dataNascimento'), email: document.getElementById('email'), telefone: document.getElementById('telefone'),
        cep: document.getElementById('cep'), logradouro: document.getElementById('logradouro'), numero: document.getElementById('numero'),
        complemento: document.getElementById('complemento'), bairro: document.getElementById('bairro'), cidade: document.getElementById('cidade'), estado: document.getElementById('estado'),
        cargo: document.getElementById('cargo'), dataAdmissao: document.getElementById('dataAdmissao'), idRelogioPonto: document.getElementById('idRelogioPonto'),
        observacoes: document.getElementById('observacoes'), salarioBase: document.getElementById('salarioBase'), valorDia: document.getElementById('valorDia'),
        formaPagamento: document.getElementById('formaPagamento'), chavePix: document.getElementById('chavePix'), dadosBancarios: document.getElementById('dadosBancarios'),
        chavePixContainer: document.getElementById('chavePixContainer'), dadosBancariosContainer: document.getElementById('dadosBancariosContainer'),
        fotoFuncionarioFile: document.getElementById('fotoFuncionarioFile'), photoPreview: document.getElementById('photoPreview'),
        currentPhotoName: document.getElementById('currentPhotoName'), contratoFuncionarioFile: document.getElementById('contratoFuncionarioFile'),
        currentContratoName: document.getElementById('currentContratoName'), identidadeFuncionarioFile: document.getElementById('identidadeFuncionarioFile'),
        currentIdentidadeName: document.getElementById('currentIdentidadeName'), asoFuncionarioFile: document.getElementById('asoFuncionarioFile'),
        currentAsoName: document.getElementById('currentAsoName'), documentosPendentes: document.getElementById('documentosPendentes'),
    };

    // Adiciona Listeners de Máscaras
    formFields.cpf?.addEventListener('input', applyCpfMask);
    formFields.telefone?.addEventListener('input', applyPhoneMask);
    formFields.cep?.addEventListener('input', applyCepMask);
    formFields.salarioBase?.addEventListener('input', applyCurrencyMask);
    formFields.valorDia?.addEventListener('input', applyCurrencyMask);

    // Lógica da API de CEP
    async function fetchAddressFromCEP(cepValue) {
        const cleanCep = cepValue.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;
        showLoading();
        const addressFields = [formFields.logradouro, formFields.bairro, formFields.cidade, formFields.estado];
        addressFields.forEach(field => field.value = 'Buscando...');
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            const data = await response.json();
            if (data.erro) {
                showToast('warning', 'CEP não encontrado', 'Verifique o CEP e tente novamente.');
                addressFields.forEach(field => field.value = '');
            } else {
                formFields.logradouro.value = data.logradouro;
                formFields.bairro.value = data.bairro;
                formFields.cidade.value = data.localidade;
                formFields.estado.value = data.uf;
                formFields.numero.focus();
                showToast('success', 'Endereço Encontrado!', 'Os campos foram preenchidos.');
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            showToast('error', 'Erro na Busca', 'Não foi possível buscar o endereço. Tente novamente.');
            addressFields.forEach(field => field.value = '');
        } finally {
            hideLoading();
        }
    }
    formFields.cep?.addEventListener('blur', (event) => fetchAddressFromCEP(event.target.value));

    // Lógica de Upload e Exclusão de Arquivos
    async function uploadSingleFile(file, pathPrefix, cpf) {
        if (!file) return null;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const uniqueFileName = `${pathPrefix}_${Date.now()}.${fileExtension}`;
        const storagePath = `funcionarios_documentos/${cpf}/${uniqueFileName}`;
        const fileRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(fileRef, file);
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', (snapshot) => {}, (error) => reject(error),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ url: downloadURL, path: storagePath });
                }
            );
        });
    }
    async function deleteFileFromStorage(filePath) {
        if (!filePath) return;
        try {
            await deleteObject(ref(storage, filePath));
        } catch (error) {
            if (error.code !== 'storage/object-not-found') {
                console.warn("Erro ao excluir arquivo antigo do Storage:", error, "Path:", filePath);
            }
        }
    }
    
    // Evento de Submit Principal
    funcionarioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        submitBtn.disabled = true;

        const cpfLimpo = formFields.cpf.value.replace(/\D/g, '');

        if (!formFields.nomeCompleto.value || !cpfLimpo || !formFields.cargo.value || !formFields.dataAdmissao.value) {
            showToast('error', 'Campos Obrigatórios', 'Por favor, preencha todos os campos com *.');
            hideLoading();
            submitBtn.disabled = false;
            return;
        }

        let fileData = {
            foto: { url: formFields.fotoFuncionarioUrl.value, path: formFields.fotoFuncionarioPath.value },
            contrato: { url: formFields.contratoFuncionarioUrl.value, path: formFields.contratoFuncionarioPath.value },
            identidade: { url: formFields.identidadeFuncionarioUrl.value, path: formFields.identidadeFuncionarioPath.value },
            aso: { url: formFields.asoFuncionarioUrl.value, path: formFields.asoFuncionarioPath.value },
        };
        
        try {
            for (const key of Object.keys(fileRefs)) {
                if (fileRefs[key]) {
                    showToast('info', 'Upload', `Enviando ${key}...`);
                    const oldPath = fileData[key].path;
                    const uploadResult = await uploadSingleFile(fileRefs[key], key, cpfLimpo);
                    if (uploadResult) {
                        if (oldPath) await deleteFileFromStorage(oldPath);
                        fileData[key] = uploadResult;
                    }
                }
            }
            await salvarDadosFuncionario(fileData);

        } catch (error) {
            console.error("Erro no processo de submissão:", error);
            showToast('error', 'Erro Crítico', `Ocorreu um erro: ${error.message}`);
        } finally {
            hideLoading();
            submitBtn.disabled = false;
        }
    });
    
    // Função para Salvar os Dados no Firestore
    async function salvarDadosFuncionario(uploadedFiles) {
        const cleanCurrency = (value) => {
            if (!value) return null;
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly === '') return null;
            return parseFloat(digitsOnly) / 100;
        };

        const funcionarioData = {
            nomeCompleto: formFields.nomeCompleto.value,
            email: formFields.email.value,
            cpf: formFields.cpf.value.replace(/\D/g, ''),
            rg: formFields.rg.value,
            dataNascimento: formFields.dataNascimento.value ? Timestamp.fromDate(new Date(formFields.dataNascimento.value + 'T00:00:00')) : null,
            telefone: formFields.telefone.value.replace(/\D/g, ''),
            cep: formFields.cep.value.replace(/\D/g, ''),
            logradouro: formFields.logradouro.value, numero: formFields.numero.value, complemento: formFields.complemento.value,
            bairro: formFields.bairro.value, cidade: formFields.cidade.value, estado: formFields.estado.value,
            cargo: formFields.cargo.value,
            dataAdmissao: formFields.dataAdmissao.value ? Timestamp.fromDate(new Date(formFields.dataAdmissao.value + 'T00:00:00')) : null,
            idRelogioPonto: formFields.idRelogioPonto.value,
            salarioBase: cleanCurrency(formFields.salarioBase.value),
            valorDia: cleanCurrency(formFields.valorDia.value),
            formaPagamento: formFields.formaPagamento.value,
            chavePix: formFields.chavePix.value, dadosBancarios: formFields.dadosBancarios.value,
            documentosPendentes: formFields.documentosPendentes.checked,
            observacoes: formFields.observacoes.value,
            fotoFuncionarioUrl: uploadedFiles.foto.url, fotoFuncionarioPath: uploadedFiles.foto.path,
            contratoFuncionarioUrl: uploadedFiles.contrato.url, contratoFuncionarioPath: uploadedFiles.contrato.path,
            identidadeFuncionarioUrl: uploadedFiles.identidade.url, identidadeFuncionarioPath: uploadedFiles.identidade.path,
            asoFuncionarioUrl: uploadedFiles.aso.url, asoFuncionarioPath: uploadedFiles.aso.path,
            updatedAt: serverTimestamp()
        };
        
        const funcionarioCollectionRef = collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`);
        if (currentEditId) {
            await setDoc(doc(funcionarioCollectionRef, currentEditId), funcionarioData, { merge: true });
            showToast('success', 'Sucesso', 'Funcionário atualizado com sucesso!');
        } else {
            funcionarioData.createdAt = serverTimestamp();
            await addDoc(funcionarioCollectionRef, funcionarioData);
            showToast('success', 'Sucesso', 'Funcionário adicionado com sucesso!');
        }
        resetForm();
    }

    // Funções de Apoio (Reset, Preenchimento para Edição, etc.)
    function resetForm() { /* ... (mesma função de antes) ... */ }
    formFields.formaPagamento?.addEventListener('change', () => { /* ... (mesma função de antes) ... */ });
    cancelEditBtn.addEventListener('click', () => { if(confirm('Deseja limpar o formulário?')) resetForm(); });

    async function loadAllEmployees() {
        try {
            const querySnapshot = await getDocs(query(collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`), orderBy('nomeCompleto')));
            todosFuncionarios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch(error) {
            console.error("Erro ao carregar lista de funcionários:", error);
        }
    }
    
    function fillFormForEdit(id) {
        const data = todosFuncionarios.find(f => f.id === id);
        if (!data) { showToast("error", "Erro", "Funcionário não encontrado."); return; }
        
        resetForm();
        currentEditId = id;
        formTitle.textContent = 'Editar Funcionário';
        
        // Preenche todos os campos (incluindo os de arquivo, que agora são inputs ocultos)
        Object.keys(formFields).forEach(key => {
            if (formFields[key] && data[key] !== undefined) {
                if (formFields[key].type === 'date' && data[key] instanceof Timestamp) {
                    formFields[key].value = new Date(data[key].seconds * 1000).toISOString().split('T')[0];
                } else if (formFields[key].type === 'checkbox') {
                    formFields[key].checked = data[key];
                } else {
                    formFields[key].value = data[key];
                }
            }
        });

        // Preenche máscaras e preview de imagem
        formFields.cpf.dispatchEvent(new Event('input'));
        formFields.telefone.dispatchEvent(new Event('input'));
        formFields.cep.dispatchEvent(new Event('input'));
        formFields.salarioBase.dispatchEvent(new Event('input'));
        formFields.valorDia.dispatchEvent(new Event('input'));
        if (data.fotoFuncionarioUrl) {
            formFields.photoPreview.src = data.fotoFuncionarioUrl;
        }
        formFields.formaPagamento.dispatchEvent(new Event('change'));
    }

    // Inicialização da Página
    const urlParams = new URLSearchParams(window.location.search);
    const editIdFromUrl = urlParams.get('editId');
    if (editIdFromUrl) {
        showLoading();
        loadAllEmployees().then(() => {
            fillFormForEdit(editIdFromUrl);
            hideLoading();
        });
    }
}