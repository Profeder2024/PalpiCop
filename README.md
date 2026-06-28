# 🏆 PalpiCop - Copa do Mundo 2026

O **PalpiCop** é um sistema web moderno de palpites (bolão) desenvolvido exclusivamente para engajar estudantes durante as rodadas da Copa do Mundo 2026. O projeto conta com autenticação institucional, interface responsiva adaptada para celulares (Android/iOS), efeitos sonoros de imersão e um painel administrativo exclusivo para o professor gerenciar resultados em tempo real.

---

## ✨ Funcionalidades Principais

* 🔐 **Login Institucional Seguro**: Restrito para e-mails escolares ou educacionais (ex: `@escola.pr.gov.br`).
* 🗓️ **Rodadas Automáticas por Dia**: O sistema identifica a data atual e renderiza apenas os confrontos daquele dia específico.
* 🔒 **Palpite Único Diário**: O estudante só pode enviar um palpite por rodada. Após o envio, os campos são bloqueados no banco de dados.
* ♿ **Acessibilidade**: Botões integrados no topo para controle dinâmico do tamanho das letras (A+ e A-).
* 🎵 **Trilha Sonora e Efeitos**: Áudio ambiente de estádio (`Goleada.mp3`) que inicia após o login, controle de volume deslizante e sons de digitação e sucesso.
* ⚙️ **Painel Secreto do Professor (ADM)**: Área protegida por senha para inserção de placares reais sem necessidade de mexer no código.
* 📊 **Auditoria e Mitos da Rodada**: Exibição privada para o administrador dos acertos de cada aluno e destaque automático (card dourado) para quem gabaritar a rodada.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5** & **JavaScript (ES6 Modules)**
* **Tailwind CSS** (Estilização responsiva via CDN)
* **Firebase Cloud Firestore** (Banco de dados NoSQL em tempo real)
* **Flagcdn API** (Renderização automática das bandeiras oficiais das seleções)

---

## ⚙️ Configuração e Uso do Professor (ADM)

### 1. Acessando o Painel
No canto superior direito da tela inicial, existe um botão discreto de **Engrenagem (⚙️)**. 
Ao clicar nele, o sistema solicitará a senha mestre.

* **Senha Padrão:** `

### 2. Inserindo Resultados e Calculando Pontos
Assim que os jogos reais do dia terminarem:
1. Acesse o Painel ADM com a senha.
2. Digite os placares oficiais da rodada no bloco **"Inserir Placares Reais de Hoje"**.
3. Clique em **Salvar Placares Oficiais**.
4. Logo abaixo, clique em **"🔄 Atualizar Lista"** para processar os acertos dos alunos instantaneamente. Os estudantes que acertarem todos os jogos aparecerão no topo como os *Mitos da Rodada*.

---

## 📁 Estrutura de Arquivos Recomendada

Para que o projeto funcione perfeitamente no **GitHub Pages**, garanta que a raiz do repositório contenha:

```text
├── index.html       # Estrutura visual e telas do app
├── app.js           # Lógica do Firebase, calendário e ADM
├── fundo.png        # Imagem de fundo estilo desenho do estádio
└── Goleada.mp3      # Arquivo de áudio para música de fundo
