// public/js/funcionario.js

import { supabase } from './nhost-config.js';
import { checkAuthAndRedirect, showLoading, hideLoading, showToast } from './common.js';

// Roda o código quando a página terminar de carregar
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthAndRedirect();
    
    const form = document.getElementById('funcionarioForm');
    const pageTitle = document.getElementById('pageTitle');
    
    // Pega o ID do funcionário da URL (se estivermos no modo de edição)
    const urlParams = new URLSearchParams(window.location.search);
    const funcionarioId = urlParams.get('id');

    // Carrega a lista de empreendimentos para o campo <select>
    await loadEmpreendimentos();

    if (funcionarioId) {
        // Se tem um ID na URL, estamos editando um funcionário existente
        pageTitle.textContent = "Editar Funcionário";
        showLoading('Carregando dados do funcionário...');
        await loadFuncionarioData(funcionarioId);
        hideLoading();
    }

    // Adiciona o evento de 'submit' ao formulário
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveFuncionario(funcionarioId);
    });
});

/**
 * Carrega a lista de empreendimentos do Supabase e preenche o campo de seleção.
 */
async function loadEmpreendimentos() {
    const selectEmpreendimento = document.getElementById('empreendimentoId');
    if (!selectEmpreendimento) return;

    const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nomeEmpreendimento')
        .order('nomeEmpreendimento', { ascending: true });

    if (error) {
        console.error('Erro ao carregar empreendimentos:', error);
        showToast('error', 'Erro', 'Não foi possível carregar a lista de empreendimentos.');
        return;
    }

    data.forEach(empreendimento => {
        const option = document.createElement('option');
        option.value = empreendimento.id;
        option.textContent = empreendimento.nomeEmpreendimento;
        selectEmpreendimento.appendChild(option);
    });
}


/**
 * Carrega os dados de um funcionário específico do Supabase e preenche o formulário.
 * @param {string} id - O ID do funcionário a ser carregado.
 */
async function loadFuncionarioData(id) {
    const { data, error } = await supabase
        .from('funcionario')
        .select('*')
        .eq('id', id)
        .single(); // .single() pega um único resultado em vez de uma lista

    if (error || !data) {
        console.error('Erro ao carregar dados do funcionário:', error);
        showToast('error', 'Erro', 'Funcionário não encontrado.');
        return;
    }

    // Preenche cada campo do formulário com os dados do banco
    document.getElementById('nomeCompleto').value = data.nomeCompleto || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('cpf').value = data.cpf || '';
    document.getElementById('rg').value = data.rg || '';
    document.getElementById('dataNascimento').value = data.dataNascimento || '';
    document.getElementById('telefone').value = data.telefone || '';
    document.getElementById('cep').value = data.cep || '';
    document.getElementById('logradouro').value = data.logradouro || '';
    document.getElementById('numero').value = data.numero || '';
    document.getElementById('complemento').value = data.complemento || '';
    document.getElementById('bairro').value = data.bairro || '';
    document.getElementById('cidade').value = data.cidade || '';
    document.getElementById('estado').value = data.estado || '';
    document.getElementById('cargo').value = data.cargo || '';
    document.getElementById('dataAdmissao').value = data.dataAdmissao || '';
    document.getElementById('idRelogioPonto').value = data.idRelogioPonto || '';
    document.getElementById('empreendimentoId').value = data.empreendimentoId || '';
    document.getElementById('salarioBase').value = data.salarioBase || '';
    document.getElementById('valorDia').value = data.valorDia || '';
    document.getElementById('formaPagamento').value = data.formaPagamento || '';
    document.getElementById('chavePix').value = data.chavePix || '';
    document.getElementById('dadosBancarios').value = data.dadosBancarios || '';
    document.getElementById('observacoes').value = data.observacoes || '';
    document.getElementById('documentosPendentes').checked = data.documentosPendentes || false;

    // Mostra os links para os arquivos já enviados
    setViewLink('fotoFuncionarioUrl', data.fotoFuncionarioUrl);
    setViewLink('contratoFuncionarioUrl', data.contratoFuncionarioUrl);
    setViewLink('identidadeFuncionarioUrl', data.identidadeFuncionarioUrl);
    setViewLink('asoFuncionarioUrl', data.asoFuncionarioUrl);
}

/**
 * Função auxiliar para mostrar o link de um arquivo existente.
 * @param {string} elementId - O ID do elemento <a> do link.
 * @param {string} url - A URL do arquivo.
 */
function setViewLink(elementId, url) {
    const link = document.getElementById(elementId);
    if (link && url) {
        link.href = url;
        link.style.display = 'inline';
    }
}


/**
 * Função principal que salva os dados do funcionário (cria um novo ou atualiza um existente).
 * @param {string|null} funcionarioId - O ID do funcionário, se estiver editando.
 */
async function saveFuncionario(funcionarioId) {
    showLoading('Salvando dados...');

    // Pega o ID do usuário logado para criar um caminho único para os arquivos
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showToast('error', 'Erro de Autenticação', 'Sua sessão expirou. Faça login novamente.');
        hideLoading();
        return;
    }

    try {
        // Faz o upload dos arquivos para o Supabase Storage e obtém as URLs
        const fotoData = await uploadFile('fotoFuncionario', 'funcionarios-documentos', `public/${user.id}`);
        const contratoData = await uploadFile('contratoFuncionario', 'funcionarios-documentos', `public/${user.id}`);
        const identidadeData = await uploadFile('identidadeFuncionario', 'funcionarios-documentos', `public/${user.id}`);
        const asoData = await uploadFile('asoFuncionario', 'funcionarios-documentos', `public/${user.id}`);

        // Pega o nome do empreendimento selecionado para salvar na tabela de funcionário
        const selectEmpreendimento = document.getElementById('empreendimentoId');
        const empreendimentoNome = selectEmpreendimento.options[selectEmpreendimento.selectedIndex].text;

        // Monta o objeto com todos os dados do formulário
        const funcionarioData = {
            nomeCompleto: document.getElementById('nomeCompleto').value,
            email: document.getElementById('email').value,
            cpf: document.getElementById('cpf').value,
            rg: document.getElementById('rg').value,
            dataNascimento: document.getElementById('dataNascimento').value || null,
            telefone: document.getElementById('telefone').value,
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            cargo: document.getElementById('cargo').value,
            dataAdmissao: document.getElementById('dataAdmissao').value || null,
            idRelogioPonto: document.getElementById('idRelogioPonto').value,
            empreendimentoId: selectEmpreendimento.value,
            empreendimentoNome: empreendimentoNome, // Salva o nome para facilitar a exibição
            salarioBase: parseFloat(document.getElementById('salarioBase').value) || 0,
            valorDia: parseFloat(document.getElementById('valorDia').value) || 0,
            formaPagamento: document.getElementById('formaPagamento').value,
            chavePix: document.getElementById('chavePix').value,
            dadosBancarios: document.getElementById('dadosBancarios').value,
            observacoes: document.getElementById('observacoes').value,
            documentosPendentes: document.getElementById('documentosPendentes').checked,
            updatedAt: new Date().toISOString(), // Adiciona a data de atualização
        };

        // Adiciona as informações dos arquivos ao objeto, somente se um novo arquivo foi enviado
        if (fotoData) {
            funcionarioData.fotoFuncionarioUrl = fotoData.publicUrl;
            funcionarioData.fotoFuncionarioPath = fotoData.path;
        }
        if (contratoData) {
            funcionarioData.contratoFuncionarioUrl = contratoData.publicUrl;
            funcionarioData.contratoFuncionarioPath = contratoData.path;
        }
        if (identidadeData) {
            funcionarioData.identidadeFuncionarioUrl = identidadeData.publicUrl;
            funcionarioData.identidadeFuncionarioPath = identidadeData.path;
        }
        if (asoData) {
            funcionarioData.asoFuncionarioUrl = asoData.publicUrl;
            funcionarioData.asoFuncionarioPath = asoData.path;
        }

        let error;
        if (funcionarioId) {
            // Se estamos editando, faz um UPDATE no banco
            const { error: updateError } = await supabase
                .from('funcionario')
                .update(funcionarioData)
                .eq('id', funcionarioId);
            error = updateError;
        } else {
            // Se não, faz um INSERT de um novo funcionário
            const { error: insertError } = await supabase
                .from('funcionario')
                .insert(funcionarioData);
            error = insertError;
        }

        if (error) {
            throw error; // Joga o erro para o bloco catch
        }

        hideLoading();
        showToast('success', 'Sucesso!', `Funcionário ${funcionarioId ? 'atualizado' : 'cadastrado'} com sucesso.`);
        
        // Opcional: redirecionar para uma lista de funcionários após salvar
        // window.location.href = 'lista_funcionarios.html';

    } catch (error) {
        hideLoading();
        console.error('Erro ao salvar funcionário:', error);
        showToast('error', 'Erro ao Salvar', `Ocorreu um problema: ${error.message}`);
    }
}


/**
 * Função auxiliar para fazer upload de um único arquivo para o Supabase Storage.
 * @param {string} inputId - O ID do campo <input type="file">.
 * @param {string} bucketName - O nome do bucket no Supabase (ex: 'funcionarios-documentos').
 * @param {string} pathPrefix - O prefixo do caminho para salvar o arquivo.
 * @returns {Promise<Object|null>} Um objeto com { publicUrl, path } ou null se nenhum arquivo for selecionado.
 */
async function uploadFile(inputId, bucketName, pathPrefix) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput.files || fileInput.files.length === 0) {
        return null; // Nenhum arquivo selecionado
    }

    const file = fileInput.files[0];
    const filePath = `${pathPrefix}/${Date.now()}-${file.name}`;

    // Faz o upload para o bucket
    const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Falha no upload do arquivo ${file.name}: ${uploadError.message}`);
    }

    // Pega a URL pública do arquivo que acabamos de enviar
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
         throw new Error(`Não foi possível obter a URL pública para ${file.name}`);
    }

    return { publicUrl: data.publicUrl, path: filePath };
}