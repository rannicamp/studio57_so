// public/js/empreendimento.js

import { supabaseClient as supabase } from './supabase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

let currentEditId = null; // Para futura funcionalidade de edição, caso implementada.

function applyCepMask(e) {
    e.target.value = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
}

export function initializeEmpreendimentoModule() {
    const empreendimentoForm = document.getElementById('empreendimentoForm');
    const cepInput = document.getElementById('cep');
    
    // Assegura que o formulário e o campo CEP existem antes de adicionar listeners
    if (empreendimentoForm) {
        empreendimentoForm.addEventListener('submit', handleFormSubmit);
    }

    if (cepInput) {
        cepInput.addEventListener('input', applyCepMask);
        cepInput.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));
    }

    // Função para buscar endereço pelo CEP
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

    // Função principal de envio do formulário
    async function handleFormSubmit(e) {
        e.preventDefault();
        showLoading();

        const empreendimentoData = {
            nomeEmpreendimento: document.getElementById('nomeEmpreendimento').value,
            usoImovel: document.getElementById('usoImovel').value,
            descricaoProjeto: document.getElementById('descricaoProjeto').value,
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            lote: document.getElementById('lote').value,
            quadra: document.getElementById('quadra').value,
            zona: document.getElementById('zona').value,
            via: document.getElementById('via').value,
            areaTerreno: parseFloat(document.getElementById('areaTerreno').value) || null,
            proprietarioNome: document.getElementById('proprietarioNome').value,
            proprietarioCpfCnpj: document.getElementById('proprietarioCpfCnpj').value,
            responsavelTecnicoNome: document.getElementById('responsavelTecnicoNome').value,
            cauCrea: document.getElementById('cauCrea').value,
            // Removido 'criadoEm' e 'atualizadoEm' pois o Supabase gerencia automaticamente com 'timestamps'
        };

        try {
            // Usa o Supabase para inserir dados na tabela 'empreendimentos'
            const { data, error } = await supabase
                .from('empreendimentos')
                .insert([empreendimentoData])
                .select(); // Adiciona .select() para obter os dados do registro inserido

            if (error) {
                throw error;
            }

            showToast('success', 'Sucesso!', 'Empreendimento cadastrado com sucesso.');
            empreendimentoForm.reset(); // Limpa o formulário após o sucesso
            
        } catch (error) {
            console.error("Erro ao salvar empreendimento:", error);
            showToast('error', 'Erro ao Salvar', 'Não foi possível cadastrar o empreendimento.');
        } finally {
            hideLoading();
        }
    }
}

// Chame a função de inicialização quando o DOM estiver completamente carregado.
// Isso garante que todos os elementos HTML estejam disponíveis.
document.addEventListener('DOMContentLoaded', () => {
    initializeEmpreendimentoModule();
});