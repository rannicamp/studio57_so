// empreendimento.js
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, deleteDoc, where, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from './firebase-config.js'; // Importa o APP_COLLECTION_ID

let currentEmpreendimentoEditId = null; // Armazena o ID do empreendimento sendo editado

export function initializeEmpreendimentoModule(db, auth) {
    const empreendimentoForm = document.getElementById('empreendimentoForm');
    const empreendimentoList = document.getElementById('empreendimento-list');
    const formMessage = document.getElementById('form-message');
    const addEmpreendimentoBtn = document.getElementById('add-empreendimento-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const searchInput = document.getElementById('search-input');

    // Referência à coleção de empreendimentos no Firestore, utilizando o APP_COLLECTION_ID
    const empreendimentoCollectionRef = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);

    // Função para exibir mensagens de feedback no formulário
    function showFormMessage(message, type = 'info') {
        formMessage.textContent = message;
        formMessage.className = `info-message ${type}-message`; // Adiciona classe para estilo Tailwind
        formMessage.style.display = 'block'; // Garante que a mensagem seja visível
        setTimeout(() => {
            formMessage.textContent = '';
            formMessage.className = 'info-message';
            formMessage.style.display = 'none'; // Esconde a mensagem após um tempo
        }, 5000);
    }

    // Função para preencher o formulário para edição
    function fillFormForEdit(data, id) {
        document.getElementById('nomeEmpreendimento').value = data.nomeEmpreendimento || '';
        document.getElementById('localizacao').value = data.localizacao || '';
        document.getElementById('tipoEmpreendimento').value = data.tipoEmpreendimento || '';
        // Converte o Timestamp do Firestore para o formato de data HTML (YYYY-MM-DD)
        document.getElementById('dataInicio').value = data.dataInicio instanceof Timestamp ? data.dataInicio.toDate().toISOString().split('T')[0] : '';
        document.getElementById('dataPrevisaoConclusao').value = data.dataPrevisaoConclusao instanceof Timestamp ? data.dataPrevisaoConclusao.toDate().toISOString().split('T')[0] : '';
        document.getElementById('responsavel').value = data.responsavel || '';
        document.getElementById('status').value = data.status || 'planejamento';
        document.getElementById('observacoes').value = data.observacoes || '';

        currentEmpreendimentoEditId = id;
        addEmpreendimentoBtn.textContent = 'Salvar Edição';
        cancelEditBtn.style.display = 'inline-block';
        showFormMessage('Modo de edição. Cancele para adicionar um novo empreendimento.', 'info');
    }

    // Função para resetar o formulário e o modo de edição
    function resetForm() {
        empreendimentoForm.reset();
        currentEmpreendimentoEditId = null;
        addEmpreendimentoBtn.textContent = 'Adicionar Empreendimento';
        cancelEditBtn.style.display = 'none';
        formMessage.style.display = 'none'; // Esconde a mensagem
        formMessage.textContent = ''; // Limpa o texto da mensagem
    }

    // Evento de submit do formulário
    empreendimentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showFormMessage('Salvando...', 'info'); // Feedback imediato

        const nomeEmpreendimento = document.getElementById('nomeEmpreendimento').value.trim();
        const localizacao = document.getElementById('localizacao').value.trim();
        const tipoEmpreendimento = document.getElementById('tipoEmpreendimento').value;
        const dataInicioStr = document.getElementById('dataInicio').value;
        const dataPrevisaoConclusaoStr = document.getElementById('dataPrevisaoConclusao').value;
        const responsavel = document.getElementById('responsavel').value.trim();
        const status = document.getElementById('status').value;
        const observacoes = document.getElementById('observacoes').value.trim();

        // Validação básica
        if (!nomeEmpreendimento || !localizacao || !tipoEmpreendimento || !dataInicioStr || !status) {
            showFormMessage('Por favor, preencha todos os campos obrigatórios (Nome, Localização, Tipo, Data de Início, Status).', 'error');
            return;
        }

        // Converte strings de data para objetos Timestamp do Firestore
        const dataInicio = dataInicioStr ? Timestamp.fromDate(new Date(dataInicioStr)) : null;
        const dataPrevisaoConclusao = dataPrevisaoConclusaoStr ? Timestamp.fromDate(new Date(dataPrevisaoConclusaoStr)) : null;

        const empreendimentoData = {
            nomeEmpreendimento,
            localizacao,
            tipoEmpreendimento,
            dataInicio,
            dataPrevisaoConclusao,
            responsavel,
            status,
            observacoes,
            updatedAt: serverTimestamp() // Atualiza sempre que houver modificação
        };

        // Adiciona createdAt apenas se for um novo registro
        if (!currentEmpreendimentoEditId) {
            empreendimentoData.createdAt = serverTimestamp();
        }

        console.log("Dados a serem salvos:", empreendimentoData); // Log para depuração

        try {
            if (currentEmpreendimentoEditId) {
                // Modo de edição
                const docRef = doc(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`, currentEmpreendimentoEditId);
                await setDoc(docRef, empreendimentoData, { merge: true }); // Usar merge: true é importante para atualizações parciais
                showFormMessage('Empreendimento atualizado com sucesso!', 'success');
            } else {
                // Modo de adição
                await addDoc(empreendimentoCollectionRef, empreendimentoData);
                showFormMessage('Empreendimento adicionado com sucesso!', 'success');
            }
            resetForm();
            loadEmpreendimentos(); // Recarrega a lista de empreendimentos após salvar
        } catch (error) {
            console.error("Erro ao salvar empreendimento:", error);
            showFormMessage('Erro ao salvar empreendimento: ' + error.message, 'error');
        }
    });

    // Evento para cancelar edição
    cancelEditBtn.addEventListener('click', resetForm);

    // Função para carregar e exibir empreendimentos
    async function loadEmpreendimentos(searchTerm = '') {
        empreendimentoList.innerHTML = '<li class="text-center text-gray-500 py-4">Carregando empreendimentos...</li>'; // Feedback de carregamento
        let q = query(empreendimentoCollectionRef, orderBy('nomeEmpreendimento'));

        try {
            const querySnapshot = await getDocs(q);
            let empreendimentos = [];
            querySnapshot.forEach((doc) => {
                empreendimentos.push({ id: doc.id, ...doc.data() });
            });

            if (searchTerm) {
                const lowerSearchTerm = searchTerm.toLowerCase();
                empreendimentos = empreendimentos.filter(emp =>
                    (emp.nomeEmpreendimento && emp.nomeEmpreendimento.toLowerCase().includes(lowerSearchTerm)) ||
                    (emp.localizacao && emp.localizacao.toLowerCase().includes(lowerSearchTerm))
                );
            }

            if (empreendimentos.length === 0) {
                empreendimentoList.innerHTML = '<li class="info-message text-center py-4 text-gray-500">Nenhum empreendimento encontrado.</li>';
                return;
            }

            empreendimentoList.innerHTML = ''; // Limpa a lista antes de adicionar os itens
            empreendimentos.forEach((emp) => {
                const li = document.createElement('li');
                // Formatação simples da data para exibição
                const dataInicioStr = emp.dataInicio instanceof Timestamp ? emp.dataInicio.toDate().toLocaleDateString('pt-BR') : 'N/A';
                const dataPrevisaoConclusaoStr = emp.dataPrevisaoConclusao instanceof Timestamp ? emp.dataPrevisaoConclusao.toDate().toLocaleDateString('pt-BR') : 'N/A';

                li.innerHTML = `
                    <strong>${emp.nomeEmpreendimento}</strong> (${emp.tipoEmpreendimento} - Status: ${emp.status})<br>
                    Localização: ${emp.localizacao}<br>
                    Início: ${dataInicioStr} | Previsão: ${dataPrevisaoConclusaoStr}<br>
                    Responsável: ${emp.responsavel || 'N/A'}
                    <div class="actions flex justify-end space-x-2 mt-2">
                        <button class="edit-btn btn btn-warning btn-sm" data-id="${emp.id}"><i class="fas fa-edit"></i> Editar</button>
                        <button class="delete-btn btn btn-danger btn-sm" data-id="${emp.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                    </div>
                `;
                empreendimentoList.appendChild(li);
            });

            // Adiciona listeners para os botões de editar e excluir
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const idToEdit = e.currentTarget.dataset.id; // Usar currentTarget
                    const empreendimentoToEdit = empreendimentos.find(emp => emp.id === idToEdit);
                    if (empreendimentoToEdit) {
                        fillFormForEdit(empreendimentoToEdit, idToEdit);
                    }
                });
            });

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const idToDelete = e.currentTarget.dataset.id; // Usar currentTarget
                    if (confirm('Tem certeza que deseja excluir este empreendimento?')) {
                        try {
                            await deleteDoc(doc(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`, idToDelete));
                            showFormMessage('Empreendimento excluído com sucesso!', 'success');
                            loadEmpreendimentos(); // Recarrega a lista
                        } catch (error) {
                            console.error("Erro ao excluir empreendimento:", error);
                            showFormMessage('Erro ao excluir empreendimento: ' + error.message, 'error');
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Erro ao carregar empreendimentos:", error);
            empreendimentoList.innerHTML = `<li class="error-message text-center py-4 text-red-500">Erro ao carregar empreendimentos: ${error.message}</li>`;
        }
    }

    // Evento de busca
    searchInput.addEventListener('input', (e) => {
        loadEmpreendimentos(e.target.value);
    });

    // Carrega os empreendimentos ao iniciar
    loadEmpreendimentos();
}