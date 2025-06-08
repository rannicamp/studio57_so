// js/gantt.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app, APP_COLLECTION_ID } from "./firebase-config.js";
import { initializeCommonUI } from "./common.js";

const auth = getAuth(app);
const db = getFirestore(app);

const selectEmpreendimento = document.getElementById("select-empreendimento");
const nomeAtividade = document.getElementById("atividade-nome");
const etapaAtividade = document.getElementById("atividade-etapa");
const descricaoAtividade = document.getElementById("atividade-descricao");
const dataInicioInput = document.getElementById("data-inicio");
const duracaoInput = document.getElementById("duracao-input");
const dataFimInput = document.getElementById("data-fim");
const btnSalvar = document.getElementById("carregar-gantt");
const ganttPlaceholder = document.querySelector(".gantt-chart-placeholder");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    initializeCommonUI(user);
    carregarEmpreendimentos();
    carregarAtividades();
  }
});

selectEmpreendimento?.addEventListener('change', carregarAtividades);

async function carregarEmpreendimentos() {
  const ref = collection(db, `artifacts/${APP_COLLECTION_ID}/empreendimentos`);
  const snapshot = await getDocs(ref);
  snapshot.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().nomeEmpreendimento || "Sem nome";
    selectEmpreendimento.appendChild(opt);
  });
}

async function carregarAtividades() {
  const empId = selectEmpreendimento.value;
  ganttPlaceholder.innerHTML = "Carregando...";

  try {
    let atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
    if (empId) {
      atividadesRef = query(atividadesRef, where("empreendimentoId", "==", empId));
    }

    const snapshot = await getDocs(atividadesRef);
    const atividades = snapshot.docs.map((d) => d.data());
    renderizarGantt(atividades);
  } catch (e) {
    console.error(e);
    ganttPlaceholder.innerHTML = "Erro ao carregar atividades.";
  }
}

function renderizarGantt(atividades) {
  ganttPlaceholder.innerHTML = "";
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "1rem";

  atividades.forEach((a) => {
    const linha = document.createElement("div");
    linha.style.display = "flex";
    linha.style.alignItems = "center";
    linha.style.gap = "1rem";

    const nome = document.createElement("span");
    nome.style.width = "180px";
    nome.textContent = `${a.nome || "Atividade"} (${a.etapa || "Etapa"})`;

    const barra = document.createElement("div");
    barra.style.height = "1.25rem";
    barra.style.backgroundColor = "#3b82f6";
    barra.style.borderRadius = "0.25rem";
    barra.style.flex = "1";
    barra.title = `${a.descricao || ""}\n${formatarData(a.dataInicio)} até ${formatarData(a.dataFim)}`;

    linha.appendChild(nome);
    linha.appendChild(barra);
    container.appendChild(linha);
  });

  ganttPlaceholder.appendChild(container);
}

function formatarData(ts) {
  if (!ts) return "";
  const d = new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString("pt-BR");
}

function atualizarDataFim() {
  const inicioStr = dataInicioInput.value;
  const duracaoDias = parseFloat(duracaoInput.value);
  console.log("Atualizando data fim...", inicioStr, duracaoDias);
  if (!inicioStr || isNaN(duracaoDias)) return;

  const inicio = new Date(inicioStr);
  const fim = new Date(inicio.getTime() + duracaoDias * 24 * 60 * 60 * 1000);
  dataFimInput.value = fim.toISOString().split('T')[0];
}

dataInicioInput?.addEventListener('change', atualizarDataFim);
duracaoInput?.addEventListener('input', atualizarDataFim);

btnSalvar?.addEventListener("click", async () => {
  const empId = selectEmpreendimento.value;
  const nome = nomeAtividade.value.trim();
  const etapa = etapaAtividade.value.trim();
  const descricao = descricaoAtividade.value.trim();
  const inicioStr = dataInicioInput.value;
  const fimStr = dataFimInput.value;

  if (!nome || !inicioStr || !fimStr) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  try {
    const atividadesRef = collection(db, `artifacts/${APP_COLLECTION_ID}/atividades`);
    await addDoc(atividadesRef, {
      nome,
      etapa,
      descricao,
      empreendimentoId: empId || null,
      dataInicio: new Date(inicioStr),
      dataFim: new Date(fimStr),
      criadoEm: serverTimestamp()
    });

    nomeAtividade.value = "";
    etapaAtividade.value = "";
    descricaoAtividade.value = "";
    dataInicioInput.value = "";
    duracaoInput.value = "";
    dataFimInput.value = "";

    carregarAtividades();
  } catch (e) {
    console.error("Erro ao salvar atividade:", e);
    alert("Erro ao salvar atividade.");
  }
});
