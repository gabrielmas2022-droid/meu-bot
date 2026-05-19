const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = '8594892663:AAF1EvbkgMn7kRW1AXM5c75BQyyPLXMlbQI';

const ADMIN_ID = 8123986377;

const bot = new TelegramBot(token, {
    polling: true
});


// DATABASE
let database = {

    usuariosAprovados: [
        ADMIN_ID
    ],

    solicitacoes: [],

    lotes: []

};


// CARREGAR DATABASE
if (fs.existsSync('database.json')) {

    database = JSON.parse(
        fs.readFileSync('database.json')
    );

}


// CARREGAR LOTES TXT
if (fs.existsSync('./lotes')) {

    const arquivos = fs.readdirSync('./lotes');

    arquivos.forEach(nomeArquivo => {

        const numeroLote = nomeArquivo.replace('.txt', '');

        const existe = database.lotes.find(
            l => l.numero === numeroLote
        );

        if (existe) return;

        const conteudo = fs.readFileSync(
            `./lotes/${nomeArquivo}`,
            'utf8'
        );

        const contatos = conteudo
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '');

        database.lotes.push({

            numero: numeroLote,
            usos: 0,
            usuarios: [],
            contatos

        });

    });

}


// SALVAR DATABASE
function salvarDatabase() {

    fs.writeFileSync(
        'database.json',
        JSON.stringify(database, null, 2)
    );

}


salvarDatabase();


// START
bot.onText(/\/start/, async (msg) => {

    const userId = msg.from.id;
    const nome = msg.from.first_name;
    const chatId = msg.chat.id;


    // já aprovado
    if (database.usuariosAprovados.includes(userId)) {

        return bot.sendMessage(chatId,
            '✅ Você já possui acesso.');
    }


    // já solicitou
    if (database.solicitacoes.includes(userId)) {

        return bot.sendMessage(chatId,
            '⏳ Sua solicitação já foi enviada.');
    }


    // salvar solicitação
    database.solicitacoes.push(userId);

    salvarDatabase();


    // mensagem usuário
    bot.sendMessage(chatId,
        '⏳ Seu acesso está pendente de aprovação.'
    );


    // avisar admin
    bot.sendMessage(ADMIN_ID,

`🔔 Novo pedido de acesso

👤 Nome: ${nome}
🆔 ID: ${userId}`
    );

});


// APROVAR
bot.onText(/\/aprovar (.+)/, (msg, match) => {

    if (msg.from.id !== ADMIN_ID) return;

    const userId = Number(match[1]);


    // já aprovado
    if (database.usuariosAprovados.includes(userId)) {

        return bot.sendMessage(msg.chat.id,
            '⚠️ Usuário já aprovado.');
    }


    database.usuariosAprovados.push(userId);

    database.solicitacoes =
        database.solicitacoes.filter(
            id => id !== userId
        );

    salvarDatabase();


    bot.sendMessage(msg.chat.id,
        `✅ Usuário ${userId} aprovado.`
    );


    bot.sendMessage(userId,
        '✅ Seu acesso foi aprovado!'
    );

});


// REMOVER
bot.onText(/\/remover (.+)/, (msg, match) => {

    if (msg.from.id !== ADMIN_ID) return;

    const userId = Number(match[1]);


    database.usuariosAprovados =
        database.usuariosAprovados.filter(
            id => id !== userId
        );

    salvarDatabase();


    bot.sendMessage(msg.chat.id,
        `❌ Usuário ${userId} removido.`
    );

});


// LISTA
bot.onText(/\/lista/, async (msg) => {

    const chatId = msg.chat.id;
    const userId = msg.from.id;


    // verificar acesso
    if (!database.usuariosAprovados.includes(userId)) {

        return bot.sendMessage(chatId,
            '❌ Você não possui acesso.\n\nUse /start para solicitar.');
    }


    // procurar lote
    const lote = database.lotes.find(l => {

        if (l.usos >= 2) return false;

        if (l.usuarios.includes(userId)) return false;

        return true;

    });


    // sem lote
    if (!lote) {

        return bot.sendMessage(chatId,
            '❌ Nenhum lote disponível.');
    }


    // registrar
    lote.usos++;
    lote.usuarios.push(userId);

    salvarDatabase();


    // mensagem
    await bot.sendMessage(chatId,

`✅ Lista entregue com sucesso!

📦 Lote: ${lote.numero}
📊 Total de contatos: ${lote.contatos.length}

📨 Enviando a lista no chat...`
    );


    // enviar lista
    await bot.sendMessage(
        chatId,
        lote.contatos.join('\n')
    );

});


// STATUS
bot.onText(/\/status/, (msg) => {

    if (msg.from.id !== ADMIN_ID) return;


    let texto =
`📊 STATUS GERAL

👥 Usuários aprovados: ${database.usuariosAprovados.length}
⏳ Solicitações pendentes: ${database.solicitacoes.length}

📦 LOTES

`;


    database.lotes.forEach(lote => {

        texto +=
`📦 ${lote.numero}
✅ ${lote.usos}/2 usos
👤 ${lote.usuarios.length} usuários

`;

    });


    bot.sendMessage(msg.chat.id, texto);

});


// LOGS
bot.onText(/\/logs/, (msg) => {

    if (msg.from.id !== ADMIN_ID) return;


    let texto = `📜 LOGS DOS LOTES\n\n`;


    database.lotes.forEach(lote => {

        texto +=
`📦 Lote ${lote.numero}

${lote.usuarios.join('\n') || 'Nenhum'}

`;

    });


    bot.sendMessage(msg.chat.id, texto);

});


console.log('Bot ligado!');