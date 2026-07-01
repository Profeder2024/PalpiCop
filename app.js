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

// 🗓️ CALENDÁRIO DIÁRIO OFICIAL
const calendarioJogos = {
    "2026-06-29": [
        { id: "29_jogo1", mandante: "Brasil", flagM: "br", visitante: "Japão", flagV: "jp" },
        { id: "29_jogo2", mandante: "Alemanha", flagM: "de", visitante: "Paraguai", flagV: "py" },
        { id: "29_jogo3", mandante: "Holanda", flagM: "nl", visitante: "Marrocos", flagV: "ma" }
    ],
    "2026-06-30": [
        { id: "30_jogo1", mandante: "Costa do Marfim", flagM: "ci", visitante: "Noruega", flagV: "no" },
        { id: "30_jogo2", mandante: "França", flagM: "fr", visitante: "Suécia", flagV: "se" },
        { id: "30_jogo3", mandante: "México", flagM: "mx", visitante: "Equador", flagV: "ec" }
    ],
        // 🏆 RODADA DE HOJE: 01 DE JULHO DE 2026"2026-07-01": [
        { id: "01_jogo1", mandante: "Inglaterra", flagM: "gb-eng", visitante: "RD Congo", flagV: "cd" },
        { id: "01_jogo2", mandante: "Bélgica", flagM: "be", visitante: "Senegal", flagV: "sn" },
        { id: "01_jogo3", mandante: "Estados Unidos", flagM: "us", visitante: "Bósnia", flagV: "ba" }
    ]
};

function obterDataHoje() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}
const dataHoje = obterDataHoje();

function definirDataAtivaPadrao() {
    if (calendarioJogos[dataHoje]) return dataHoje;
    const datas = Object.keys(calendarioJogos).sort();
    return datas.length > 0 ? datas[datas.length - 1] : dataHoje;
}

let dataSelecionadaUsuario = definirDataAtivaPadrao();
let dataSelecionadaAdm = definirDataAtivaPadrao();
let resultadosOficiais = {}; 
let usuarioAtual = null;
let currentFontSize = 16;

const sections = {
    auth: document.getElementById('auth-section'),
    app: document.getElementById('app-section'),
    adm: document.getElementById('adm-section')
};

// Elementos Alunos
const emailInput = document.getElementById('email-input');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const gamesContainer = document.getElementById('games-container');
const saveBtn = document.getElementById('save-palpites-btn');
const saveStatus = document.getElementById('save-status');
const totalCounter = document.getElementById('total-palpites-counter');
const userDateSelect = document.getElementById('user-date-select');

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
const admDateSelect = document.getElementById('adm-date-select');

// Áudio e Estilos
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
const volumeRange = document.getElementById('volume-range');
const soundClick = document.getElementById('sound-click');
const soundSuccess = document.getElementById('sound-success');
const mainBody = document.getElementById('main-body');

bgMusic.volume = 0.5;

// --- 🌐 GERAR SELETORES DE DATAS COMPATÍVEIS ---
function configurarSeletoresDeData() {
    userDateSelect.innerHTML = '';
    admDateSelect.innerHTML = '';
    const datasOrdenadas = Object.keys(calendarioJogos).sort();

    datasOrdenadas.forEach(data => {
        const [ano, mes, dia] = data.split('-');
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const optUser = new Option(dataFormatada, data);
        optUser.selected = (data === dataSelecionadaUsuario);
        userDateSelect.appendChild(optUser);

        const optAdm = new Option(dataFormatada, data);
        optAdm.selected = (data === dataSelecionadaAdm);
        admDateSelect.appendChild(optAdm);
    });
}
configurarSeletoresDeData();

async function atualizarContador(dataFoco) {
    try {
        const querySnapshot = await getDocs(collection(db, `palpites_${dataFoco}`));
        totalCounter.innerText = querySnapshot.size;
    } catch (e) {
        totalCounter.innerText = "0";
    }
}
atualizarContador(dataSelecionadaUsuario);

// --- 🎮 MOTOR DE RENDERING DO UTILIZADOR ---
async function carregarRodadaUsuario() {
    const colecaoFoco = `palpites_${dataSelecionadaUsuario}`;
    atualizarContador(dataSelecionadaUsuario);
    gamesContainer.innerHTML = '<p class="text-center text-xs text-gray-500 py-4">A buscar palpites arquivados...</p>';

    try {
        let resOficiaisFoco = {};
        const resDoc = await getDoc(doc(db, "resultados_oficiais", dataSelecionadaUsuario));
        if (resDoc.exists()) resOficiaisFoco = resDoc.data();

        let palpiteExistente = null;
        if (usuarioAtual) {
            const docSnap = await getDoc(doc(db, colecaoFoco, usuarioAtual));
            if (docSnap.exists()) palpiteExistente = docSnap.data();
        }

        renderizarJogosUsuario(palpiteExistente, resOficiaisFoco);
    } catch (e) {
        gamesContainer.innerHTML = '<p class="text-center text-xs text-red-500">Erro ao carregar rodada.</p>';
    }
}

function renderizarJogosUsuario(palpites, oficiais) {
    gamesContainer.innerHTML = '';
    const jogosFoco = calendarioJogos[dataSelecionadaUsuario] || [];
    const jaPalpitou = palpites !== null;

    if (jogosFoco.length === 0) {
        gamesContainer.innerHTML = '<p class="text-center text-xs text-gray-500 py-4">Nenhum jogo cadastrado.</p>';
        saveBtn.classList.add('hidden');
        saveStatus.innerText = "";
        return;
    }

    jogosFoco.forEach(jogo => {
        const palpiteM = jaPalpitou ? (palpites[jogo.id]?.mandante ?? '') : '';
        const palpiteV = jaPalpitou ? (palpites[jogo.id]?.visitante ?? '') : '';
        const realM = oficiais[jogo.id]?.mandante;
        const realV = oficiais[jogo.id]?.visitante;

        let statusJogoHtml = '';
        if (realM !== null && realM !== undefined && realV !== null && realV !== undefined) {
            const acertou = (palpiteM === realM && palpiteV === realV);
            statusJogoHtml = `<div class="text-center text-[11px] mt-1 font-bold ${acertou ? 'text-green-600' : 'text-gray-500'}">Resultado Real: ${realM} x ${realV} ${acertou ? '🎉 (Acertou!)' : '❌'}</div>`;
        }

        const card = document.createElement('div');
        card.className = "bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center justify-end space-x-2 w-1/3 text-right">
                    <span class="font-bold text-gray-700 text-sm">${jogo.mandante}</span>
                    <img src="https://flagcdn.com/w40/${jogo.flagM}.png" class="w-7 h-5 object-cover rounded shadow-sm border border-gray-200">
                </div>
                <div class="flex items-center space-x-2 w-1/3 justify-center">
                    <input type="number" min="0" id="${jogo.id}-m" value="${palpiteM}" ${jaPalpitou ? 'disabled' : ''} class="placar-input w-11 p-1 text-center border rounded font-bold text-base bg-white disabled:bg-gray-100">
                    <span class="text-gray-400 font-bold text-sm">X</span>
                    <input type="number" min="0" id="${jogo.id}-v" value="${palpiteV}" ${jaPalpitou ? 'disabled' : ''} class="placar-input w-11 p-1 text-center border rounded font-bold text-base bg-white disabled:bg-gray-100">
                </div>
                <div class="flex items-center justify-start space-x-2 w-1/3 text-left">
                    <img src="https://flagcdn.com/w40/${jogo.flagV}.png" class="w-7 h-5 object-cover rounded shadow-sm border border-gray-200">
                    <span class="font-bold text-gray-700 text-sm">${jogo.visitante}</span>
                </div>
            </div>
            ${statusJogoHtml}
        `;
        gamesContainer.appendChild(card);
    });

    document.querySelectorAll('.placar-input').forEach(input => input.addEventListener('input', tocarSomTecla));

    if (jaPalpitou) {
        saveBtn.classList.add('hidden');
        saveStatus.innerText = "🔒 Palpite enviado e arquivado nesta rodada!";
        saveStatus.className = "text-center mt-3 font-semibold text-amber-600 text-xs";
    } else {
        saveBtn.classList.remove('hidden');
        saveStatus.innerText = "";
    }
}

userDateSelect.addEventListener('change', (e) => {
    dataSelecionadaUsuario = e.target.value;
    carregarRodadaUsuario();
});

// --- ⚙️ CONTROLE DO PROFESSOR (MUDANÇA DE CAMPO ADM) ---
btnAdmTrigger.addEventListener('click', () => {
    Object.values(sections).forEach(s => s.classList.add('hidden'));
    sections.adm.classList.remove('hidden');
    admPasswordInput.value = '';
    admAuthError.classList.add('hidden');
    admAuthBox.classList.remove('hidden');
    admControlBox.classList.add('hidden');
    resultsContainer.innerHTML = '<p class="text-xs text-gray-500 italic">Clique no botão acima para carregar a conferência da rodada selecionada.</p>';
    configurarSeletoresDeData();
});

admDateSelect.addEventListener('change', async (e) => {
    dataSelecionadaAdm = e.target.value;
    resultsContainer.innerHTML = '<p class="text-xs text-gray-500 italic">Rodada alterada no seletor. Clique em Carregar para auditar.</p>';
    await carregarDadosOficiaisAdm();
    renderizarPainelAdm();
});

async function carregarDadosOficiaisAdm() {
    const resDoc = await getDoc(doc(db, "resultados_oficiais", dataSelecionadaAdm));
    if (resDoc.exists()) {
        resultadosOficiais = resDoc.data();
    } else {
        resultadosOficiais = {};
        (calendarioJogos[dataSelecionadaAdm] || []).forEach(j => { resultadosOficiais[j.id] = { mandante: null, visitante: null }; });
    }
}

// 🔐 VALIDAÇÃO DIRETA DA SENHA SIMPLIFICADA PARA EVITAR ERROS NO TECLADO MOBILE
admLoginBtn.addEventListener('click', async () => {
    const senhaDigitada = admPasswordInput.value.trim();
    if (senhaDigitada === "C0p@2026" || senhaDigitada === "C0p@2026") {
        admAuthBox.classList.add('hidden');
        admControlBox.classList.remove('hidden');
        await carregarDadosOficiaisAdm();
        renderizarPainelAdm();
    } else {
        admAuthError.classList.remove('hidden');
    }
});

function renderizarPainelAdm() {
    admGamesList.innerHTML = '';
    const jogosFocoAdm = calendarioJogos[dataSelecionadaAdm] || [];

    if (jogosFocoAdm.length === 0) {
        admGamesList.innerHTML = '<p class="text-xs text-gray-500 italic text-center">Nenhum jogo nesta data.</p>';
        return;
    }

    jogosFocoAdm.forEach(jogo => {
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
    const jogosFocoAdm = calendarioJogos[dataSelecionadaAdm] || [];

    jogosFocoAdm.forEach(jogo => {
        const mVal = document.getElementById(`adm-${jogo.id}-m`).value;
        const vVal = document.getElementById(`adm-${jogo.id}-v`).value;
        novosResultados[jogo.id] = {
            mandante: mVal !== "" ? parseInt(mVal) : null,
            visitante: vVal !== "" ? parseInt(vVal) : null
        };
    });

    try {
        await setDoc(doc(db, "resultados_oficiais", dataSelecionadaAdm), novosResultados);
        resultadosOficiais = novosResultados;
        admSaveStatus.innerText = "✅ Salvo com sucesso!";
        admSaveStatus.className = "text-center text-xs font-bold mt-1 text-green-600";
    } catch (e) {
        admSaveStatus.innerText = "❌ Erro ao salvar.";
        admSaveStatus.className = "text-center text-xs font-bold mt-1 text-red-600";
    }
});

// --- 📊 EXCLUSIVO ADM: HISTÓRICO E GABARITO DA TURMA ---
viewResultsBtn.addEventListener('click', async () => {
    resultsContainer.innerHTML = '<p class="text-center text-gray-500 py-2 text-xs">A processar acertos...</p>';
    const colecaoAdmFoco = `palpites_${dataSelecionadaAdm}`;
    const jogosFocoAdm = calendarioJogos[dataSelecionadaAdm] || [];

    try {
        const querySnapshot = await getDocs(collection(db, colecaoAdmFoco));
        resultsContainer.innerHTML = '';

        if (querySnapshot.empty) {
            resultsContainer.innerHTML = '<p class="text-center text-gray-600 py-2 text-xs">Nenhum palpite nesta rodada.</p>';
            return;
        }

        const totalJogosRodada = jogosFocoAdm.length;
        let alunosGabaritaram = [];
        let listaCardsAlunos = [];

        querySnapshot.forEach((docSnap) => {
            const dadosAlun = docSnap.data();
            const emailLimpo = docSnap.id.replace(/_/g, "."); 
            let acertosContador = 0;
            let detalheLinhas = '';

            jogosFocoAdm.forEach(jogo => {
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

            if (acertosContador === totalJogosRodada && totalJogosRodada > 0) {
                alunosGabaritaram.push(emailLimpo);
            }

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

        listaCardsAlunos.forEach(cardHtml => resultsContainer.appendChild(cardHtml));

    } catch (error) {
        resultsContainer.innerHTML = '<p class="text-center text-red-600 text-xs">Erro ao processar auditoria.</p>';
    }
});

backAdmBtn.addEventListener('click', () => {
    sections.adm.classList.add('hidden');
    sections.auth.classList.remove('hidden');
    inicializarApp();
});

// --- MÓDULOS PERIFÉRICOS ---
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

// --- LOGIN INTEGRADOR ---
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    
    if (!email.includes('escola') && !email.includes('pr.gov.br')) {
        authError.innerText = "Acesso negado. Use seu e-mail institucional da escola!";
        authError.classList.remove('hidden');
        return;
    }

    usuarioAtual = email.replace(/[^a-zA-Z0-9]/g, "_");
    authError.classList.add('hidden');
    try {
        bgMusic.play().then(() => atualizarBotaoMusica(false)).catch(e => {});
        sections.auth.classList.add('hidden');
        sections.app.classList.remove('hidden');
        userDisplay.innerText = `Estudante: ${email}`;
        
        configurarSeletoresDeData();
        await carregarRodadaUsuario();
    } catch (error) {
        authError.innerText = "Erro ao conectar com o Firebase.";
        authError.classList.remove('hidden');
    }
});

saveBtn.addEventListener('click', async () => {
    if (!usuarioAtual) return;
    const colecaoFoco = `palpites_${dataSelecionadaUsuario}`;
    const docRef = doc(db, colecaoFoco, usuarioAtual);
    const palpitesParaSalvar = {};
    let preencheuTudo = true;
    const jogosFoco = calendarioJogos[dataSelecionadaUsuario] || [];

    jogosFoco.forEach(jogo => {
        const mVal = document.getElementById(`${jogo.id}-m`).value;
        const vVal = document.getElementById(`${jogo.id}-v`).value;
        if (mVal === "" || vVal === "") preencheuTudo = false;
        palpitesParaSalvar[jogo.id] = { mandante: mVal !== "" ? parseInt(mVal) : null, visitante: vVal !== "" ? parseInt(vVal) : null };
    });

    if (!preencheuTudo) {
        saveStatus.innerText = "⚠️ Preencha todos os placares.";
        saveStatus.className = "text-center mt-3 font-semibold text-red-600 text-xs";
        return;
    }

    try {
        await setDoc(docRef, palpitesParaSalvar);
        soundSuccess.volume = 0.6; soundSuccess.play().catch(e => {});
        await carregarRodadaUsuario();
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

async function inicializarApp() { await atualizarContador(definirDataAtivaPadrao()); }
inicializarApp();
