import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCKQsSI2IgaU9QWdqjj3Bt28lbUGOOAq04",
    authDomain: "palpcop.firebaseapp.com",
    projectId: "palpcop",
    storageBucket: "palpcop.firebasestorage.app",
    messagingSenderId: "387466105257",
    appId: "1:387466105257:web:1ad0cc7476e3a9bff0f4b8",
    measurementId: "G-V02HQM8Z8Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🗓️ CALENDÁRIO DIÁRIO COMPLETO
const calendarioJogos = {
    "2026-06-29": [
        { id: "29_jogo1", mandante: "Brasil", flagM: "br", visitante: "Japão", flagV: "jp" },
        { id: "29_jogo2", mandante: "Alemanha", flagM: "de", visitante: "Paraguai", flagV: "py" },
        { id: "29_jogo3", mandante: "Holanda", flagM: "nl", visitante: "Marrocos", flagV: "ma" }
    ],
    "2026-06-30": [
        { id: "30_jogo1", mandante: "Argentina", flagM: "ar", visitante: "França", flagV: "fr" },
        { id: "30_jogo2", mandante: "Espanha", flagM: "es", visitante: "Nigéria", flagV: "ng" }
    ]
};

function obterDataHoje() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}
const dataHoje = obterDataHoje();
const jogosDoDia = calendarioJogos[dataHoje] || calendarioJogos["2026-06-29"]; 

const SENHA_MESTRE = "copa2026"; // 🔐 SUA SENHA DO PAINEL ADM
let resultadosOficiais = {}; 
let usuarioAtual = null;
let currentFontSize = 16;

const colecaoDoDia = `palpites_${dataHoje}`;

const sections = {
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    adm: document.getElementById('adm-section')
};

// Elementos comuns
const emailInput = document.getElementById('email-input');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const gamesContainer = document.getElementById('games-container');
const saveBtn = document.getElementById('save-palpites-btn');
const saveStatus = document.getElementById('save-status');
const totalCounter = document.getElementById('total-palpites-counter');

// Elementos ADM
const btnAdmTrigger = document.getElementById('btn-adm-trigger');
const backAdmBtn = document.getElementById('back-adm-btn');
const admPasswordInput = document.getElementById('adm-password-input');
const admLoginBtn = document.getElementById('adm-login-btn');
const admAuthError = document.getElementById('adm-auth-error');
const admAuthBox = document.getElementById('adm-auth-box');
const admControlBox = document.getElementById('adm-control-box');
const admGamesList = document.getElementById('adm-games-list');
const admSaveBtn = document.getElementById('adm-save-btn');
const admSaveStatus = document.getElementById('adm-save-status');
const viewResultsBtn = document.getElementById('view-results-btn');
const resultsContainer = document.getElementById('results-container');

// Áudios e Interface
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
const volumeRange = document.getElementById('volume-range');
const soundClick = document.getElementById('sound-click');
const soundSuccess = document.getElementById('sound-success');
const mainBody = document.getElementById('main-body');

bgMusic.volume = 0.5;

// --- 🌐 INICIALIZADOR ---
async function inicializarApp() {
    try {
        const querySnapshot = await getDocs(collection(db, colecaoDoDia));
        totalCounter.innerText = querySnapshot.size;

        const resDoc = await getDoc(doc(db, "resultados_oficiais", dataHoje));
        if (resDoc.exists()) {
            resultadosOficiais = resDoc.data();
        } else {
            jogosDoDia.forEach(j => { resultadosOficiais[j.id] = { mandante: null, visitante: null }; });
        }
    } catch (e) {
        totalCounter.innerText = "0";
    }
}
inicializarApp();

// --- ⚙️ PAINEL ADMINISTRATIVO (PROFESSOR) ---
btnAdmTrigger.addEventListener('click', () => {
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections.adm.classList.remove('hidden');
    admPasswordInput.value = '';
    admAuthError.classList.add('hidden');
    admAuthBox.classList.remove('hidden');
    admControlBox.classList.add('hidden');
    resultsContainer.innerHTML = '<p class="text-xs text-gray-500 italic">Clique no botão acima para carregar a conferência dos alunos.</p>';
});

admLoginBtn.addEventListener('click', () => {
    if (admPasswordInput.value === SENHA_MESTRE) {
        admAuthBox.classList.add('hidden');
        admControlBox.classList.remove('hidden');
        renderizarPainelAdm();
    } else {
        admAuthError.classList.remove('hidden');
    }
});

function renderizarPainelAdm() {
    admGamesList.innerHTML = '';
    jogosDoDia.forEach(jogo => {
        const mVal = resultadosOficiais[jogo.id]?.mandante ?? '';
        const vVal = resultadosOficiais[jogo.id]?.visitante ?? '';
        
        const item = document.createElement('div');
        item.className = "flex items-center justify-between bg-gray-100 p-2 rounded border text-sm";
        item.innerHTML = `
            <span class="font-bold text-gray-700 w-2/5 text-right text-xs">${jogo.mandante}</span>
            <div class="flex items-center space-x-1 justify-center w-1/5">
                <input type="number" id="adm-${jogo.id}-m" value="${mVal}" class="w-10 p-1 text-center border rounded font-bold bg-white text-black text-xs">
                <span>x</span>
                <input type="number" id="adm-${jogo.id}-v" value="${vVal}" class="w-10 p-1 text-center border rounded font-bold bg-white text-black text-xs">
            </div>
            <span class="font-bold text-gray-700 w-2/5 text-left text-xs">${jogo.visitante}</span>
        `;
        admGamesList.appendChild(item);
    });
}

admSaveBtn.addEventListener('click', async () => {
    const novosResultados = {};
    jogosDoDia.forEach(jogo => {
        const mVal = document.getElementById(`adm-${jogo.id}-m`).value;
        const vVal = document.getElementById(`adm-${jogo.id}-v`).value;
        novosResultados[jogo.id] = {
            mandante: mVal !== "" ? parseInt(mVal) : null,
            visitante: vVal !== "" ? parseInt(vVal) : null
        };
    });

    try {
        await setDoc(doc(db, "resultados_oficiais", dataHoje), novosResultados);
        resultadosOficiais = novosResultados;
        admSaveStatus.innerText = "✅ Placares salvos com sucesso!";
        admSaveStatus.className = "text-center text-xs font-bold mt-1 text-green-600";
    } catch (e) {
        admSaveStatus.innerText = "❌ Erro ao salvar dados.";
        admSaveStatus.className = "text-center text-xs font-bold mt-1 text-red-600";
    }
});

// --- 📊 EXCLUSIVO ADM: CARREGAR ACERTOS E DESTAQUES (GABARITOS) ---
viewResultsBtn.addEventListener('click', async () => {
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 py-2 text-xs">Carregando acertos...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, colecaoDoDia));
        resultsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            resultsContainer.innerHTML = '<p class="text-center text-gray-600 py-2 text-xs">Nenhum palpite enviado hoje.</p>';
            return;
        }

        const totalJogosRodada = jogosDoDia.length;
        let alunosGabaritaram = [];
        let listaCardsAlunos = [];

        querySnapshot.forEach((docSnap) => {
            const dadosAlun = docSnap.data();
            const emailLimpo = docSnap.id.replace(/_/g, "."); 
            let acertosContador = 0;
            let detalheLinhas = '';

            jogosDoDia.forEach(jogo => {
                const palpiteM = dadosAlun[jogo.id]?.mandante;
                const palpiteV = dadosAlun[jogo.id]?.visitante;
                const realM = resultadosOficiais[jogo.id]?.mandante;
                const realV = resultadosOficiais[jogo.id]?.visitante;

                if (realM !== null && realM !== undefined && realV !== null && realV !== undefined) {
                    const acertou = (palpiteM === realM && palpiteV === realV);
                    if (acertou) acertosContador++;
                    detalheLinhas += `
                        <div class="text-[10px] flex justify-between border-b border-gray-100 py-0.5">
                            <span class="text-gray-500">${jogo.mandante} x ${jogo.visitante}</span>
                            <span class="font-mono">P: <b>${palpiteM}x${palpiteV}</b> | R: <b>${realM}x${realV}</b></span>
                            <span class="font-bold ${acertou ? 'text-green-600' : 'text-gray-400'}">${acertou ? '✅' : '❌'}</span>
                        </div>
                    `;
                } else {
                    detalheLinhas += `
                        <div class="text-[10px] flex justify-between border-b border-gray-100 py-0.5 text-gray-400">
                            <span>${jogo.mandante} x ${jogo.visitante}</span>
                            <span>Aguardando jogo (Palpite: ${palpiteM}x${palpiteV})</span>
                        </div>
                    `;
                }
            });

            // Se o aluno acertou absolutamente TODOS os jogos da rodada atual
            if (acertosContador === totalJogosRodada && totalJogosRodada > 0) {
                alunosGabaritaram.push(emailLimpo);
            }

            // Guarda o card normal para a listagem geral abaixo
            const card = document.createElement('div');
            card.className = "bg-white p-2 rounded border border-gray-200 shadow-sm text-xs mb-2";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-1 bg-gray-50 p-1 rounded">
                    <span class="font-bold text-blue-800 text-xs">${emailLimpo}</span>
                    <span class="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 rounded-full">🎯 ${acertosContador} acertos</span>
                </div>
                <div class="space-y-0.5 p-1">${detalheLinhas}</div>
            `;
            listaCardsAlunos.push(card);
        });

        // 🏆 SEÇÃO DE DESTAQUE: INJETA NO TOPO SE HOUVER ALGUÉM QUE GABARITOU
        if (alunosGabaritaram.length > 0) {
            const containerGabarito = document.createElement('div');
            containerGabarito.className = "bg-amber-50 border-2 border-amber-400 p-3 rounded-lg mb-4 text-center shadow-md animate-pulse";
            
            let nomesEstudantes = alunosGabaritaram.map(email => `🥇 <b class="text-amber-900">${email}</b>`).join('<br>');
            
            containerGabarito.innerHTML = `
                <h5 class="text-xs font-extrabold text-amber-700 tracking-wider uppercase mb-1">🔥 MITOS DA RODADA - ACERTARAM TUDO! 🔥</h5>
                <div class="text-xs space-y-1">${nomesEstudantes}</div>
            `;
            resultsContainer.appendChild(containerGabarito);
        }

        // Adiciona o restante da lista de alunos logo abaixo do destaque
        listaCardsAlunos.forEach(cardHtml => resultsContainer.appendChild(cardHtml));

    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-center text-red-600 text-xs">Erro ao processar ranking.</p>';
    }
});

backAdmBtn.addEventListener('click', () => {
    sections.adm.classList.add('hidden');
    sections.auth.classList.remove('hidden');
    inicializarApp();
});

// --- CONTROLES DE ÁUDIO, LOGIN E SALVAMENTO DOS ALUNOS ---
musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) { bgMusic.play(); atualizarBotaoMusica(false); }
    else { bgMusic.pause(); atualizarBotaoMusica(true); }
});
volumeRange.addEventListener('input', (e) => { bgMusic.volume = e.target.value; atualizarBotaoMusica(bgMusic.paused); });
function atualizarBotaoMusica(isMuted) {
    if (isMuted) { musicBtn.innerHTML = "🔇 Som Mutado"; musicBtn.className = "text-white bg-red-600/80 px-2 h-8 rounded text-xs font-semibold transition"; }
    else { musicBtn.innerHTML = "🎵 Som Ativo"; musicBtn.className = "text-white bg-green-600/80 px-2 h-8 rounded text-xs font-semibold transition"; }
}
function tocarSomTecla() { soundClick.currentTime = 0; soundClick.volume = 0.4; soundClick.play().catch(e => {}); }

document.getElementById('btn-font-inc').addEventListener('click', () => { if (currentFontSize < 24) { currentFontSize += 2; mainBody.style.fontSize = currentFontSize + 'px'; } });
document.getElementById('btn-font-dec').addEventListener('click', () => { if (currentFontSize > 12) { currentFontSize -= 2; mainBody.style.fontSize = currentFontSize + 'px'; } });

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email.includes('escola')) {
        authError.innerText = "Acesso negado. Use seu e-mail da escola!";
        authError.classList.remove('hidden');
        return;
    }
    const usuarioId = email.replace(/[^a-zA-Z0-9]/g, "_");
    authError.classList.add('hidden');
    try {
        bgMusic.play().then(() => atualizarBotaoMusica(false)).catch(e => {});
        const docRef = doc(db, colecaoDoDia, usuarioId);
        const docSnap = await getDoc(docRef);
        usuarioAtual = usuarioId;
        sections.auth.classList.add('hidden');
        sections.app.classList.remove('hidden');
        userDisplay.innerText = `Estudante: ${email}`;
        renderizarJogos(docSnap.exists() ? docSnap.data() : null);
    } catch (error) {
        authError.innerText = "Erro de conexão.";
        authError.classList.remove('hidden');
    }
});

function renderizarJogos(palpitesExistentes) {
    gamesContainer.innerHTML = '';
    const jaPalpitou = palpitesExistentes !== null;

    jogosDoDia.forEach(jogo => {
        const palpiteM = jaPalpitou ? palpitesExistentes[jogo.id]?.mandante : '';
        const palpiteV = jaPalpitou ? palindesExistentes ? palpitesExistentes[jogo.id]?.visitante : '';
        const pV = jaPalpitou ? palpitesExistentes[jogo.id]?.visitante : '';

        const card = document.createElement('div');
        card.className = "flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm";
        card.innerHTML = `
            <div class="flex items-center justify-end space-x-2 w-1/3 text-right">
                <span class="font-bold text-gray-700">${jogo.mandante}</span>
                <img src="https://flagcdn.com/w40/${jogo.flagM}.png" class="w-7 h-5 object-cover rounded shadow-sm border border-gray-200">
            </div>
            <div class="flex items-center space-x-2 w-1/3 justify-center">
                <input type="number" min="0" id="${jogo.id}-m" value="${palpiteM}" ${jaPalpitou ? 'disabled' : ''} class="placar-input w-12 p-1.5 text-center border rounded font-bold text-lg bg-white disabled:bg-gray-100">
                <span class="text-gray-400 font-bold">X</span>
                <input type="number" min="0" id="${jogo.id}-v" value="${pV}" ${jaPalpitou ? 'disabled' : ''} class="placar-input w-12 p-1.5 text-center border rounded font-bold text-lg bg-white disabled:bg-gray-100">
            </div>
            <div class="flex items-center justify-start space-x-2 w-1/3 text-left">
                <img src="https://flagcdn.com/w40/${jogo.flagV}.png" class="w-7 h-5 object-cover rounded shadow-sm border border-gray-200">
                <span class="font-bold text-gray-700">${jogo.visitante}</span>
            </div>
        `;
        gamesContainer.appendChild(card);
    });

    document.querySelectorAll('.placar-input').forEach(input => input.addEventListener('input', tocarSomTecla));

    if (jaPalpitou) {
        saveBtn.classList.add('hidden');
        saveStatus.innerText = "🔒 Palpite único enviado para a rodada de hoje!";
        saveStatus.className = "text-center mt-3 font-semibold text-amber-600";
    } else {
        saveBtn.classList.remove('hidden');
        saveStatus.innerText = "";
    }
}

saveBtn.addEventListener('click', async () => {
    if (!usuarioAtual) return;
    const docRef = doc(db, colecaoDoDia, usuarioAtual);
    const palpitesParaSalvar = {};
    let preencheuTudo = true;

    jogosDoDia.forEach(jogo => {
        const mVal = document.getElementById(`${jogo.id}-m`).value;
        const vVal = document.getElementById(`${jogo.id}-v`).value;
        if (mVal === "" || vVal === "") preencheuTudo = false;
        palpitesParaSalvar[jogo.id] = { mandante: mVal !== "" ? parseInt(mVal) : null, visitante: vVal !== "" ? parseInt(vVal) : null };
    });

    if (!preencheuTudo) {
        saveStatus.innerText = "⚠️ Preencha todos os placares.";
        saveStatus.className = "text-center mt-3 font-semibold text-red-600";
        return;
    }

    try {
        await setDoc(docRef, palpitesParaSalvar);
        soundSuccess.volume = 0.6; soundSuccess.play().catch(e => {});
        renderizarJogos(palpitesParaSalvar);
    } catch (e) {
        saveStatus.innerText = "Erro ao salvar palpite.";
    }
});

logoutBtn.addEventListener('click', () => {
    usuarioAtual = null; emailInput.value = ""; bgMusic.pause(); atualizarBotaoMusica(true);
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections.auth.classList.remove('hidden');
    inicializarApp();
});
