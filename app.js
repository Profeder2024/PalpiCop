import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Suas credenciais reais do Palpcop
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

const jogosDoDia = [
    { id: "jogo1", mandante: "Brasil", visitante: "Japão" },
    { id: "jogo2", mandante: "Alemanha", visitante: "Paraguai" },
    { id: "jogo3", mandante: "Holanda", visitante: "Marrocos" } 
];

let usuarioAtual = null;

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const emailInput = document.getElementById('email-input');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const gamesContainer = document.getElementById('games-container');
const saveBtn = document.getElementById('save-palpites-btn');
const saveStatus = document.getElementById('save-status');

loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();

    // Validação flexível para aceitar seu e-mail da escola
    if (!email.includes('escola')) {
        authError.innerText = "Acesso negado. Use seu e-mail @escola";
        authError.classList.remove('hidden');
        return;
    }

    // Substitui caracteres especiais do e-mail para criar um ID válido no banco
    const usuarioId = email.replace(/[^a-zA-Z0-9]/g, "_");
    authError.classList.add('hidden');

    try {
        const docRef = doc(db, "palpites", usuarioId);
        const docSnap = await getDoc(docRef);

        usuarioAtual = usuarioId;
        
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        userDisplay.innerText = `Estudante: ${email}`;

        renderizarJogos(docSnap.exists() ? docSnap.data() : null);
    } catch (error) {
        authError.innerText = "Erro ao conectar com o banco de dados do Firebase.";
        authError.classList.remove('hidden');
        console.error(error);
    }
});

function renderizarJogos(palpitesExistentes) {
    gamesContainer.innerHTML = '';
    const jaPalpitou = palpitesExistentes !== null;

    jogosDoDia.forEach(jogo => {
        const palpiteMandante = jaPalpitou ? palpitesExistentes[jogo.id]?.mandante : '';
        const palpiteVisitante = jaPalpitou ? palpitesExistentes[jogo.id]?.visitante : '';

        const card = document.createElement('div');
        card.className = "flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3";
        card.innerHTML = `
            <span class="w-1/3 text-right font-semibold text-gray-700">${jogo.mandante}</span>
            <div class="flex items-center space-x-2 w-1/3 justify-center">
                <input type="number" min="0" id="${jogo.id}-m" value="${palpiteMandante}" ${jaPalpitou ? 'disabled' : ''} class="w-12 p-1 text-center border rounded font-bold text-lg bg-white">
                <span class="text-gray-400 font-bold">X</span>
                <input type="number" min="0" id="${jogo.id}-v" value="${palpiteVisitante}" ${jaPalpitou ? 'disabled' : ''} class="w-12 p-1 text-center border rounded font-bold text-lg bg-white">
            </div>
            <span class="w-1/3 text-left font-semibold text-gray-700">${jogo.visitante}</span>
        `;
        gamesContainer.appendChild(card);
    });

    if (jaPalpitou) {
        saveBtn.classList.add('hidden');
        saveStatus.innerText = "🔒 Você já enviou seu palpite único de hoje!";
        saveStatus.className = "text-center mt-2 font-medium text-amber-600";
    } else {
        saveBtn.classList.remove('hidden');
        saveStatus.innerText = "";
    }
}

saveBtn.addEventListener('click', async () => {
    if (!usuarioAtual) return;

    const docRef = doc(db, "palpites", usuarioAtual);
    const palpitesParaSalvar = {};
    let preencheuTudo = true;

    jogosDoDia.forEach(jogo => {
        const mVal = document.getElementById(`${jogo.id}-m`).value;
        const vVal = document.getElementById(`${jogo.id}-v`).value;
        
        if (mVal === "" || vVal === "") preencheuTudo = false;

        palpitesParaSalvar[jogo.id] = {
            mandante: mVal !== "" ? parseInt(mVal) : null,
            visitante: vVal !== "" ? parseInt(vVal) : null
        };
    });

    if (!preencheuTudo) {
        saveStatus.innerText = "⚠️ Preencha todos os placares.";
        saveStatus.className = "text-center mt-2 font-medium text-red-600";
        return;
    }

    try {
        await setDoc(docRef, palpitesParaSalvar);
        renderizarJogos(palpitesParaSalvar);
    } catch (error) {
        saveStatus.innerText = "Erro ao salvar seu palpite no Firestore.";
        saveStatus.className = "text-center mt-2 font-medium text-red-600";
    }
});

logoutBtn.addEventListener('click', () => {
    usuarioAtual = null;
    emailInput.value = "";
    appSection.classList.add('hidden');
    authSection.classList.remove('hidden');
});
