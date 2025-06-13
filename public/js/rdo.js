// public/js/ver-rdo.js (VERSÃO COM CORREÇÃO DA LIGHTBOX E OBSERVAÇÕES)
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_COLLECTION_ID } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './common.js';

export function initializeVerRdoModule(db) {
    const detailsContainer = document.getElementById('rdo-details-container').querySelector('.form-body');

    // ===== LÓGICA DA LIGHTBOX =====
    const lightbox = {
        overlay: document.getElementById('lightbox-overlay'),
        image: document.querySelector('.lightbox-image'),
        caption: document.querySelector('.lightbox-caption'),
        closeBtn: document.querySelector('.lightbox-close'),
        prevBtn: document.querySelector('.lightbox-prev'),
        nextBtn: document.querySelector('.lightbox-next'),
        photos: [],
        currentIndex: 0,
        isOpen: false,

        open(clickedIndex) {
            this.currentIndex = clickedIndex;
            this.update();
            this.overlay.style.display = 'flex';
            setTimeout(() => {
                this.overlay.classList.add('show');
            }, 10);
            document.body.style.overflow = 'hidden';
            this.isOpen = true;
        },
        close() {
            this.overlay.classList.remove('show');
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 300);
            document.body.style.overflow = 'auto';
            this.isOpen = false;
        },
        next() {
            if (this.currentIndex < this.photos.length - 1) {
                this.currentIndex++;
                this.update();
            }
        },
        prev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.update();
            }
        },
        update() {
            if (this.photos.length === 0) return;
            const photo = this.photos[this.currentIndex];
            this.image.src = photo.url;
            this.image.alt = photo.description;
            this.caption.textContent = photo.description;

            this.prevBtn.style.display = this.currentIndex > 0 ? 'block' : 'none';
            this.nextBtn.style.display = this.currentIndex < this.photos.length - 1 ? 'block' : 'none';
        },
        setPhotos(photos) {
            this.photos = photos;
        },
        initListeners(container) {
            this.closeBtn.addEventListener('click', () => this.close());
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
            this.nextBtn.addEventListener('click', () => this.next());
            this.prevBtn.addEventListener('click', () => this.prev());

            document.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowRight') this.next();
                if (e.key === 'ArrowLeft') this.prev();
            });

            container.addEventListener('click', (e) => {
                const photoCard = e.target.closest('.photo-card');
                if (photoCard) {
                    const allCards = Array.from(container.querySelectorAll('.photo-card'));
                    const clickedIndex = allCards.indexOf(photoCard);
                    this.open(clickedIndex);
                }
            });
        }
    };
    // =============================

    const getRdoIdFromUrl = () => new URLSearchParams(window.location.search).get('id');

    const formatDate = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return 'N/A';
        return timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const createSectionTitle = (title) => `<h4 class="form-section-title">${title}</h4>`;

    const createInfoGrid = (data) => `
        <div class="form-grid-2-col">
            <div class="form-group"><label class="form-label">Empreendimento</label><p>${data.empreendimentoNome || 'Não informado'}</p></div>
            <div class="form-group"><label class="form-label">Data do Relatório</label><p>${formatDate(data.dataRelatorio)}</p></div>
            <div class="form-group"><label class="form-label">Responsável</label><p>${data.responsavelRdo?.nome || 'Não informado'}</p></div>
            <div class="form-group"><label class="form-label">Condições de Trabalho</label><p class="capitalize">${data.condicoesTrabalho?.join(', ') || 'Não informado'}</p></div>
        </div>
        <div class="form-group"><label class="form-label">Condições Climáticas</label><div class="badge-group">${(data.condicoesClimaticas || []).map(c => `<span class="badge weather-badge">${c}</span>`).join(' ') || 'Nenhuma'}</div></div>
        <hr class="form-divider">
    `;

    const createTeamList = (team) => `
        ${createSectionTitle('Lista de Chamada')}
        <div class="rdo-view-list">
            ${(team || []).length > 0 ? team.map(person => `<div class="rdo-list-row"><span class="item-name"><i class="fas fa-user fa-fw"></i> ${person.nome}</span><span class="badge status-${person.status}">${person.status}</span></div>`).join('') : '<p>Nenhum funcionário registrado.</p>'}
        </div>
        <hr class="form-divider">
    `;
    
    const createActivityList = (activities) => `
        ${createSectionTitle('Status das Atividades do Cronograma')}
        <div class="rdo-view-list">
             ${(activities || []).length > 0 ? activities.map(activity => `<div class="rdo-list-row"><span class="item-name"><i class="fas fa-tasks fa-fw"></i> ${activity.nome}</span><span class="badge status-${activity.status.replace(/\s+/g, '-')}">${activity.status}</span></div>`).join('') : '<p>Nenhuma atividade registrada.</p>'}
        </div>
        <hr class="form-divider">
    `;

    // *** FUNÇÃO CORRIGIDA PARA EXIBIR OCORRÊNCIAS ESTRUTURADAS ***
    const createObservations = (ocorrencias) => {
        let content = `${createSectionTitle('Ocorrências e Observações Gerais')}`;
        if (!ocorrencias || ocorrencias.length === 0) {
            content += '<div class="rdo-view-observations">Nenhuma ocorrência registrada.</div>';
        } else {
            content += '<div class="rdo-view-observations-list">';
            ocorrencias.forEach(item => {
                content += `
                    <div class="observation-item severity-${item.severity || 'informativa'}">
                        <strong class="observation-severity-tag">${item.severity || 'Informativa'}</strong>
                        <p class="observation-text">${item.text}</p>
                    </div>
                `;
            });
            content += '</div>';
        }
        content += '<hr class="form-divider">';
        return content;
    };


    const createPhotoGallery = (photos, rdoDate) => {
        if (!photos || photos.length === 0) return '';
        lightbox.setPhotos(photos); // Armazena as fotos para a lightbox usar
        return `
            ${createSectionTitle('Relatório Fotográfico')}
            <div class="photo-gallery">
                ${photos.map(photo => `
                    <div class="photo-card" role="button" tabindex="0" aria-label="Ampliar imagem: ${photo.description || 'Sem descrição'}">
                        <div class="photo-img-container" style="background-image: url('${photo.url}')"></div>
                        <div class="photo-card-body">
                            <p class="photo-description">${photo.description || 'Sem descrição.'}</p>
                            <p class="photo-date"><i class="fas fa-calendar-alt fa-fw"></i> ${rdoDate}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const loadRdoData = async () => {
        const rdoId = getRdoIdFromUrl();
        if (!rdoId) {
            detailsContainer.innerHTML = '<p class="error-message">ID do RDO não fornecido na URL.</p>';
            return;
        }
        showLoading();
        try {
            const rdoRef = doc(db, `artifacts/${APP_COLLECTION_ID}/rdo`, rdoId);
            const rdoSnap = await getDoc(rdoRef);
            if (rdoSnap.exists()) {
                const data = rdoSnap.data();
                let content = '';
                content += createInfoGrid(data);
                content += createTeamList(data.maoDeObra);
                content += createActivityList(data.statusAtividades);
                content += createObservations(data.ocorrencias); // Chama a função corrigida
                content += createPhotoGallery(data.fotos, formatDate(data.dataRelatorio));
                detailsContainer.innerHTML = content;

                lightbox.initListeners(detailsContainer);
            } else {
                showToast('error', 'Erro', 'RDO não encontrado.');
                detailsContainer.innerHTML = '<p class="error-message">O RDO solicitado não foi encontrado.</p>';
            }
        } catch (error) {
            console.error("Erro ao carregar dados do RDO:", error);
            showToast('error', 'Erro de Rede', 'Não foi possível carregar os dados.');
            detailsContainer.innerHTML = '<p class="error-message">Ocorreu um erro ao carregar as informações.</p>';
        } finally {
            hideLoading();
        }
    };
    loadRdoData();
}