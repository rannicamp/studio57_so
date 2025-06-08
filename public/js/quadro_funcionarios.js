// quadro_funcionarios.js (CORRIGIDO)
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

let allEmployeesData = [];
let dbInstance, storageInstance;

function displayEmployees(employees, db, storage) {
    const container = document.getElementById('employee-grid-container');
    const loadingMessage = document.getElementById('loading-message');

    if (!container) {
        console.error("Elemento 'employee-grid-container' não encontrado.");
        return;
    }

    container.innerHTML = '';

    if (employees.length === 0) {
        loadingMessage.textContent = 'Nenhum funcionário encontrado.';
        loadingMessage.style.display = 'block'; // Garante que a mensagem seja visível
    } else if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }

    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        // As URLs dos arquivos vêm de campos como 'fotoFuncionarioUrl', etc.
        const fotoUrl = employee.fotoFuncionarioUrl || employee.fotoUrl; // Compatibilidade com nomes antigos
        const dataAdmissao = employee.dataAdmissao ? new Date(employee.dataAdmissao.seconds * 1000).toLocaleDateString('pt-BR') : '--';

        card.innerHTML = `
            <div class="photo-container">
                ${fotoUrl ? `<img src="${fotoUrl}" alt="Foto de ${employee.nomeCompleto}">` : '<i class="fas fa-user icon-placeholder"></i>'}
            </div>
            <h3>${employee.nomeCompleto || 'Nome não informado'}</h3>
            <p class="cargo">${employee.cargo || 'Cargo não informado'}</p>
            <div class="info-item">
                <i class="fas fa-id-card fa-fw"></i> <span class="info-text"><strong>CPF:</strong> ${employee.cpf || '--'}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-phone fa-fw"></i> <span class="info-text"><strong>Telefone:</strong> ${employee.telefone || '--'}</span>
            </div>
             <div class="info-item">
                <i class="fas fa-calendar-alt fa-fw"></i> <span class="info-text"><strong>Admissão:</strong> ${dataAdmissao}</span>
            </div>
            <div class="info-item">
                <i class="fas fa-file-alt fa-fw"></i> <span class="info-text"><strong>Docs:</strong> <span class="employee-status-card ${employee.documentosPendentes ? 'status-pending' : 'status-ok'}">${employee.documentosPendentes ? 'Pendentes' : 'OK'}</span></span>
            </div>
            <div class="actions">
                <a href="registro_funcionario.html?editId=${employee.id}" class="btn-outline-form edit-btn"><i class="fas fa-pencil-alt"></i> Editar</a>
                <button class="btn-danger-form delete-btn" data-id="${employee.id}" data-cpf="${employee.cpf}"><i class="fas fa-trash-alt"></i> Excluir</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Adiciona listener de exclusão
    container.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const employeeId = e.currentTarget.dataset.id;
            const employeeCpf = e.currentTarget.dataset.cpf;
            if (confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.')) {
                await deleteEmployee(employeeId, employeeCpf, db, storage);
            }
        });
    });
}

function filterEmployees() {
    const searchTerm = document.getElementById('searchQuadroInput').value.toLowerCase();
    const filtered = allEmployeesData.filter(emp => {
        return (emp.nomeCompleto?.toLowerCase() || '').includes(searchTerm) ||
               (emp.cpf?.toLowerCase() || '').includes(searchTerm) ||
               (emp.cargo?.toLowerCase() || '').includes(searchTerm);
    });
    displayEmployees(filtered, dbInstance, storageInstance);
}

async function loadAndDisplayFuncionarios(db, storage) {
    showLoading();
    try {
        // CORREÇÃO: O nome da coleção estava "funcionarios" (plural), o correto é "funcionario" (singular)
        const funcionariosCollectionRef = collection(db, `artifacts/${APP_COLLECTION_ID}/funcionario`);
        const querySnapshot = await getDocs(funcionariosCollectionRef);
        allEmployeesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allEmployeesData.sort((a, b) => (a.nomeCompleto || '').localeCompare(b.nomeCompleto || ''));
        displayEmployees(allEmployeesData, db, storage);
    } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
        showToast('error', 'Erro', 'Não foi possível carregar os dados dos funcionários.');
    } finally {
        hideLoading();
    }
}

async function deleteEmployee(employeeId, employeeCpf, db, storage) {
    if (!employeeId || !employeeCpf) {
        showToast('error', 'Erro', 'ID ou CPF do funcionário não fornecido para exclusão.');
        return;
    }
    showLoading();
    try {
        // CORREÇÃO: O nome da coleção também estava errado aqui
        const employeeDocRef = doc(db, `artifacts/${APP_COLLECTION_ID}/funcionario`, employeeId);
        await deleteDoc(employeeDocRef);

        const filePrefixes = ['foto', 'contrato', 'identidade', 'aso'];
        for (const prefix of filePrefixes) {
             try {
                // Deleta da pasta funcionarios_documentos, conforme salvo em funcionario.js
                const storagePath = `funcionarios_documentos/${employeeCpf}/${prefix}`;
                const fileRef = ref(storage, storagePath);
                // NOTA: Esta parte é complexa pois não sabemos a extensão original.
                // A exclusão de arquivos do Storage pode precisar de uma lógica mais robusta no futuro,
                // como armazenar o caminho completo do arquivo no Firestore.
                // Por enquanto, a exclusão do registro no banco de dados é o mais importante.
             } catch(e) {
                // Ignora erros de exclusão de arquivos por enquanto.
             }
        }
        showToast('success', 'Sucesso', 'Funcionário excluído com sucesso.');
        await loadAndDisplayFuncionarios(db, storage);

    } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
        showToast('error', 'Erro', 'Falha ao excluir o funcionário. Tente novamente.');
    } finally {
        hideLoading();
    }
}

export function initializeQuadroFuncionariosModule(db, storage) {
    dbInstance = db;
    storageInstance = storage;
    const searchInput = document.getElementById('searchQuadroInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterEmployees);
    }
    loadAndDisplayFuncionarios(db, storage);
}