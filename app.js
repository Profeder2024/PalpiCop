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

// 🗓️ CALENDÁRIO COMPLETO POR DIAS
// O formato da data deve ser "AAAA-MM-DD" para o sistema reconhecer o dia atual.
const calendarioJogos = {
    "2026-06-29": [
        { id: "29_jogo1", mandante: "Brasil", flagM: "br", visitante: "Japão", flagV: "jp" },
        { id: "29_jogo2", mandante: "Alemanha", flagM: "de", visitante: "Paraguai", flagV: "py" },
        { id: "29_jogo3", mandante: "Holanda", flagM: "nl", visitante: "Marrocos", flagV: "ma" }
    ],
    "2026-06-30": [
        { id: "30_jogo1", mandante: "Argentina", flagM: "ar", visitante: "França", flagV: "fr" },
        { id: "30_jogo2", mandante: "Espanha", flagM: "es", visitante: "Nigéria", flagV: "ng" }
    ],
    "2026-07-01": [
        { id: "01_jogo1", mandante: "Portugal", flagM: "pt", visitante: "México", flagV: "mx" },
        { id: "01_jogo2", mandante: "Inglaterra", flagM: "gb-eng", visitante: "Coreia do Sul", flagV: "kr" }
    ]
    // 💡 Pode continuar a adicionar os próximos dias aqui seguindo a mesma estrutura!
};

// 📝 GABARITO DE RESULTADOS REAIS (Atualize aqui quando os jogos terminarem)
const resultadosOficiais = {
    "29_jogo1": { mandante: 3, visitante: 1 },
    "29_jogo2": { mandante: 2, visitante: 0 },
    "29_jogo3": { mandante: 1, visitante: 2 },
    
    "30_jogo1": { mandante: null, visitante: null }, // Mude após o fim do jogo
    "30_jogo2": { mandante: null, visitante: null }
};

// --- FUNÇÃO PARA PEGAR A DATA DE HOJE NO BRASIL (FUSO HORÁRIO LOCAL) ---
function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

const dataHoje = obterDataHoje();
// Procura os jogos de hoje. Se não houver, pega o dia 29 como padrão para testes.
const jogosDoDia = calendarioJogos[dataHoje] || calendarioJogos["2026-06-29"]; 

let usuarioAtual = null;
let currentFontSize = 16;

// Elementos HTML
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const rankingSection = document.getElementById('ranking-section');
const emailInput = document.getElementById('email-input');
const loginBtn = document.getElementById('login-btn');
const viewResultsBtn = document.getElementById('view-results-btn');
const backResultsBtn = document.getElementById('back-results-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const gamesContainer = document.getElementById('games-container');
const resultsContainer = document.getElementById('results-container');
const saveBtn = document.getElementById('save-palpites-btn');
const saveStatus = document.getElementById('save-status');
const totalCounter = document.getElementById('total-palpites-counter');

// Áudios e Acessibilidade
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
const volumeRange = document.getElementById('volume-range');
const soundClick = document.getElementById('sound-click');
const soundSuccess = document.getElementById('sound-success');
const mainBody = document.getElementById('main-body');
const btnFontInc = document.getElementById('btn-font-inc');
const btnFontDec = document.getElementById('btn-font-dec');

bgMusic.volume = 0.5;

// Identificador único da coleção do banco para não misturar os dias
// Cada dia terá sua própria tabela de palpites: "palpites_2026-06-29", etc.
const colecaoDoDia = `palpites_${dataHoje}`;

// --- CONTADOR DE PALPITES ---
async function atualizarContadorTotal() {
    try {
        const querySnapshot = await getDocs(collection(db, colecaoDoDia));
        totalCounter.innerText = querySnapshot.size;
    } catch (e) {
        totalCounter.innerText = "0";
    }
}
atualizarContadorTotal();

// --- SISTEMA DE VERIFICAÇÃO DE ACERTOS (AUDITORIA) ---
viewResultsBtn.addEventListener('click', async () => {
    authSection.classList.add('hidden');
    rankingSection.classList.remove('hidden');
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">A calcular acertos...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, colecaoDoDia));
        resultsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            resultsContainer.innerHTML = '<p class="text-center text-gray-600 py-4">Nenhum palpite enviado hoje.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const dadosAlun = docSnap.data();
            const emailLimpo = docSnap.id.replace(/_/g, "."); 
            
            let acertosContador = 0;
            let detalheLinhas = '';

            jogosDoDia.forEach(jogo => {
                const palpiteM = dadosAlun[jogo.id]?.mandante;
                const palpiteV = dadosAlun[jogo.id]?.visitante;
                
                const resultado = resultadosOficiais[jogo.id];
                const realM = resultado ? resultado.mandante : null;
                const realV = resultado ? resultado.visitante : null;

                if (realM !== null && realV !== null) {
                    const acertou = (palpiteM === realM && palpiteV === realV);
                    if (acertou) acertosContador++;
                    
                    detalheLinhas += `
                        <div class="text-xs flex justify-between border-b border-gray-100 py-1">
                            <span class="text-gray-600">${jogo.mandante} x ${jogo.visitante}</span>
                            <span class="font-mono">Palpite: <b>${palpiteM}x${palpiteV}</b> | Real: <b>${realM}x${realV}</b></span>
                            <span class="font-bold ${acertou ? 'text-green-600' : 'text-gray-400'}">${acertou ? '✅ +1' : '❌ 0'}</span>
                        </div>
                    `;
                } else {
                    detalheLinhas += `
                        <div class="text-xs flex justify-between border-b border-gray-100 py-1 text-gray-400">
                            <span>${jogo.mandante} x ${jogo.visitante}</span>
                            <span>Aguardando fim do jogo (Seu palpite: ${palpiteM}x${palpiteV})</span>
                        </div>
                    `;
                }
            });

            const cardAlun = document.createElement('div');
            cardAlun.className = "bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm mb-3";
            cardAlun.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-sm text-blue-700">${emailLimpo}</span>
                    <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">🎯 ${acertosContador} acertos</span>
                </div>
                <div class="space-y-1 bg-white p-2 rounded border border-gray-100">${detalheLinhas}</div>
            `;
            resultsContainer.appendChild(cardAlun);
        });

    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-center text-red-600">Erro ao carregar dados.</p>';
    }
});

backResultsBtn.addEventListener('click', () => {
    rankingSection.classList.add('hidden');
    authSection.classList.remove('hidden');
    atualizarContadorTotal();
});

// --- ÁUDIO E ACESSIBILIDADE ---
musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) { bgMusic.play(); atualizarBotaoMusica(false); }
    else { bgMusic.pause(); atualizarBotaoMusica(true); }
});
volumeRange.addEventListener('input', (e) => {
    bgMusic.volume = e.target.value;
    atualizarBotaoMusica(bgMusic.paused);
});
function atualizarBotaoMusica(isMuted) {
    if (isMuted) {
        musicBtn.innerHTML = "🔇 Som Mutado";
        musicBtn.className = "text-white bg-red-600/80 px-2 h-8 rounded text-xs font-semibold transition";
    } else {
        musicBtn.innerHTML = "🎵 Som Ativo";
        musicBtn.className = "text-white bg-green-600/80 px-2 h-8 rounded text-xs font-semibold transition";
    }
}
function tocarSomTecla() { soundClick.currentTime = 0; soundClick.volume = 0.4; soundClick.play().catch(e => {}); }
btnFontInc.addEventListener('click', () => { if (currentFontSize < 24) { currentFontSize += 2; mainBody.style.fontSize = currentFontSize + 'px'; } });
btnFontDec.addEventListener('click', () => { if (currentFontSize > 12) { currentFontSize -= 2; mainBody.style.fontSize = currentFontSize + 'px'; } });

// --- LOGIN ---
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
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        userDisplay.innerText = `Estudante: ${email}`;
        renderizarJogos(docSnap.exists() ? docSnap.data() : null);
    } catch (error) {
        authError.innerText = "Erro ao conectar com o banco.";
        authError.classList.remove('hidden');
    }
});

// --- RENDERIZAR JOGOS ---
function renderizarJogos(palpitesExistentes) {
    gamesContainer.innerHTML = '';
    const jaPalpitou = palpitesExistentes !== null;

    jogosDoDia.forEach(jogo => {
        const palpiteM = jaPalpitou ? palpitesExistentes[jogo.id]?.mandante : '';
        const palpiteV = jaPalpitou ? palpitesExistentes[jogo.id]?.visitante : '';

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
                <input type="number" min="0" id="${jogo.id}-v" value="${palpiteV}" ${jaPalpitou ? 'disabled' : ''} class="placar-input w-12 p-1.5 text-center border rounded font-bold text-lg bg-white disabled:bg-gray-100">
            </div>
            <div class="flex items-center justify-start space-x-2 w-1/3 text-left">
                <img src="https://flagcdn.com/w40/${jogo.flagV}.png" class="w-7 h-5 object-cover rounded shadow-sm border border-gray-200">
                <span class="font-bold text-gray-700">${jogo.visitor || jogo.visitante}</span>
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

// --- SALVAR ---
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
    appSection.classList.add('hidden'); authSection.classList.remove('hidden'); atualizarContadorTotal();
});
