const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = '8594892663:AAF1EvbkgMn7kRW1AXM5c75BQyyPLXMlbQI';

const ADMIN_IDS = [
    8123986377,
    8195619720
];

function isAdmin(userId) {
    return ADMIN_IDS.includes(Number(userId));
}

const bot = new TelegramBot(token, {
    polling: true
});


// DATABASE PADRÃO
let database = {

    usuariosAprovados: [
        ...ADMIN_IDS
    ],

    solicitacoes: [],

    limites: {},

    lotes: []

};


// CARREGAR DATABASE
if (fs.existsSync('database.json')) {

    try {

        database = JSON.parse(
            fs.readFileSync('database.json', 'utf8')
        );

    } catch (error) {

        console.log('Erro ao carregar database.json:', error.message);

    }

}


// CORRIGIR DATABASE ANTIGO
if (!Array.isArray(database.usuariosAprovados)) {
    database.usuariosAprovados = [];
}

database.usuariosAprovados = database.usuariosAprovados
    .map(Number)
    .filter(id => !Number.isNaN(id));

ADMIN_IDS.forEach(adminId => {

    if (!database.usuariosAprovados.includes(adminId)) {
        database.usuariosAprovados.push(adminId);
    }

});


if (!Array.isArray(database.solicitacoes)) {
    database.solicitacoes = [];
}

database.solicitacoes = database.solicitacoes
    .map(Number)
    .filter(id => !Number.isNaN(id));


if (!database.limites || typeof database.limites !== 'object' || Array.isArray(database.limites)) {
    database.limites = {};
}


if (!Array.isArray(database.lotes)) {
    database.lotes = [];
}

database.lotes.forEach(lote => {

    if (!lote.numero) lote.numero = '000';

    lote.usos = Number(lote.usos || 0);

    if (!Array.isArray(lote.usuarios)) {
        lote.usuarios = [];
    }

    lote.usuarios = lote.usuarios
        .map(Number)
        .filter(id => !Number.isNaN(id));

    if (!Array.isArray(lote.contatos)) {
        lote.contatos = [];
    }

});


// CARREGAR LOTES TXT
if (fs.existsSync('./lotes')) {

    const arquivos = fs.readdirSync('./lotes')
        .filter(nomeArquivo => nomeArquivo.endsWith('.txt'))
        .sort();

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


// ENVIAR MENSAGEM GRANDE EM PARTES
async function enviarMensagemGrande(chatId, texto) {

    const limite = 3800;

    if (!texto || texto.trim() === '') {
        return bot.sendMessage(chatId, 'Nenhuma informação encontrada.');
    }

    for (let i = 0; i < texto.length; i += limite) {

        const parte = texto.slice(i, i + limite);

        await bot.sendMessage(chatId, parte);

    }

}


// AVISAR TODOS OS ADMINS
function avisarAdmins(texto, opcoes = {}) {

    ADMIN_IDS.forEach(adminId => {

        bot.sendMessage(adminId, texto, opcoes).catch(() => {});

    });

}


// GERAR STATUS
function gerarStatus() {

    let texto =
`📊 STATUS GERAL

👑 Administradores: ${ADMIN_IDS.length}
👥 Usuários aprovados: ${database.usuariosAprovados.length}
⏳ Solicitações pendentes: ${database.solicitacoes.length}
📦 Total de lotes: ${database.lotes.length}

📦 LOTES

`;


    database.lotes.forEach(lote => {

        texto +=
`📦 ${lote.numero}
✅ ${lote.usos}/2 usos
👤 ${lote.usuarios.length} usuários
📊 Contatos: ${lote.contatos.length}

`;

    });


    return texto;

}


// GERAR LOGS
function gerarLogs() {

    let texto = `📜 LOGS DOS LOTES\n\n`;


    database.lotes.forEach(lote => {

        texto +=
`📦 Lote ${lote.numero}

${lote.usuarios.join('\n') || 'Nenhum'}

`;

    });


    return texto;

}


// ENTREGAR LISTA
async function entregarLista(chatId, userId) {

    userId = Number(userId);


    // verificar acesso
    if (!database.usuariosAprovados.includes(userId)) {

        return bot.sendMessage(chatId,
            '❌ Você não possui acesso.\n\nUse /start para solicitar.');
    }


    // criar limite do usuário
    if (!database.limites[userId]) {

        database.limites[userId] = {
            total: 0,
            tempo: Date.now()
        };

    }


    const limite = database.limites[userId];

    limite.total = Number(limite.total || 0);
    limite.tempo = Number(limite.tempo || Date.now());


    // resetar limite após 24 horas
    if (Date.now() - limite.tempo > 86400000) {

        limite.total = 0;
        limite.tempo = Date.now();

    }


    // verificar limite diário
    if (limite.total >= 4) {

        salvarDatabase();

        return bot.sendMessage(chatId,

`❌ Limite diário atingido.

⏳ Aguarde 24 horas para solicitar novas listas.`);
    }


    // procurar lote disponível
    const lote = database.lotes.find(l => {

        if (l.usos >= 2) return false;

        if (l.usuarios.includes(userId)) return false;

        if (!l.contatos || l.contatos.length === 0) return false;

        return true;

    });


    // nenhum lote disponível
    if (!lote) {

        return bot.sendMessage(chatId,
            '❌ Nenhum lote disponível.');
    }


    // registrar uso do lote
    lote.usos++;
    lote.usuarios.push(userId);


    // registrar limite diário
    limite.total++;

    salvarDatabase();


    // mensagem inicial
    await bot.sendMessage(chatId,

`✅ Lista entregue com sucesso!

📦 Lote: ${lote.numero}
📊 Total de contatos: ${lote.contatos.length}

📥 Restam ${4 - limite.total} listas hoje.

📨 Enviando a lista no chat...`
    );


    // enviar contatos
    await enviarMensagemGrande(
        chatId,
        lote.contatos.join('\n')
    );

}


// START
bot.onText(/\/start/, async (msg) => {

    const userId = Number(msg.from.id);
    const nome = msg.from.first_name || 'Sem nome';
    const chatId = msg.chat.id;


    // SEM ACESSO
    if (!database.usuariosAprovados.includes(userId)) {

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


        // avisar admins com botões
        avisarAdmins(

`🔔 Novo pedido de acesso

👤 Nome: ${nome}
🆔 ID: ${userId}`,

{
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '✅ Aprovar',
                    callback_data: `aprovar_${userId}`
                },
                {
                    text: '❌ Recusar',
                    callback_data: `recusar_${userId}`
                }
            ]
        ]
    }
});

        return;

    }


    // BOTÕES USUÁRIO
    let botoes = [

        [
            {
                text: '📦 Receber Lista',
                callback_data: 'receber_lista'
            }
        ],

        [
            {
                text: '🆔 Meu ID',
                callback_data: 'meu_id'
            }
        ]

    ];


    // BOTÕES ADMIN
    if (isAdmin(userId)) {

        botoes.push(

            [
                {
                    text: '📊 Status',
                    callback_data: 'status'
                }
            ],

            [
                {
                    text: '📜 Logs',
                    callback_data: 'logs'
                }
            ],

            [
                {
                    text: '👥 Usuários',
                    callback_data: 'usuarios'
                }
            ],

            [
                {
                    text: '📥 Pendentes',
                    callback_data: 'pendentes'
                }
            ]

        );

    }


    // MENU
    bot.sendMessage(chatId,

`🐉 Bem-vindo ao Listas Zap!

Escolha uma opção abaixo:`,

{
    reply_markup: {
        inline_keyboard: botoes
    }
});

});


// APROVAR POR COMANDO
bot.onText(/\/aprovar (.+)/, (msg, match) => {

    if (!isAdmin(msg.from.id)) return;

    const userId = Number(match[1]);


    if (!userId) {

        return bot.sendMessage(msg.chat.id,
            '❌ ID inválido.');
    }


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
        '✅ Seu acesso foi aprovado!\n\nUse /start para abrir o menu.'
    ).catch(() => {});

});


// REMOVER POR COMANDO
bot.onText(/\/remover (.+)/, (msg, match) => {

    if (!isAdmin(msg.from.id)) return;

    const userId = Number(match[1]);


    if (!userId) {

        return bot.sendMessage(msg.chat.id,
            '❌ ID inválido.');
    }


    if (isAdmin(userId)) {

        return bot.sendMessage(msg.chat.id,
            '❌ Você não pode remover um administrador pelo bot.js atual.');
    }


    database.usuariosAprovados =
        database.usuariosAprovados.filter(
            id => id !== userId
        );

    salvarDatabase();


    bot.sendMessage(msg.chat.id,
        `❌ Usuário ${userId} removido.`
    );

});


// STATUS POR COMANDO
bot.onText(/\/status/, async (msg) => {

    if (!isAdmin(msg.from.id)) return;

    await enviarMensagemGrande(
        msg.chat.id,
        gerarStatus()
    );

});


// LOGS POR COMANDO
bot.onText(/\/logs/, async (msg) => {

    if (!isAdmin(msg.from.id)) return;

    await enviarMensagemGrande(
        msg.chat.id,
        gerarLogs()
    );

});


// USUÁRIOS POR COMANDO
bot.onText(/\/usuarios/, async (msg) => {

    if (!isAdmin(msg.from.id)) return;

    await enviarMensagemGrande(
        msg.chat.id,
        `👥 Usuários aprovados:\n\n${database.usuariosAprovados.join('\n') || 'Nenhum'}`
    );

});


// PENDENTES POR COMANDO
bot.onText(/\/pendentes/, async (msg) => {

    if (!isAdmin(msg.from.id)) return;

    await enviarMensagemGrande(
        msg.chat.id,
        `📥 Pendentes:\n\n${database.solicitacoes.join('\n') || 'Nenhum'}`
    );

});


// PING
bot.onText(/\/ping/, (msg) => {

    bot.sendMessage(msg.chat.id,
        '🏓 Bot online!');

});


// BOTÕES
bot.on('callback_query', async (query) => {

    const chatId = query.message.chat.id;
    const data = query.data;
    const userId = Number(query.from.id);


    // responder botão imediatamente para não ficar carregando
    await bot.answerCallbackQuery(query.id).catch(() => {});


    try {


        // APROVAR USUÁRIO PELO BOTÃO
        if (data.startsWith('aprovar_')) {

            if (!isAdmin(userId)) return;

            const novoUserId = Number(data.replace('aprovar_', ''));


            if (!novoUserId) {

                return bot.sendMessage(chatId,
                    '❌ ID inválido.');
            }


            if (database.usuariosAprovados.includes(novoUserId)) {

                await bot.sendMessage(chatId,
                    `⚠️ Usuário ${novoUserId} já estava aprovado.`
                );

                await bot.editMessageText(
                    `⚠️ Pedido já estava aprovado

🆔 ID: ${novoUserId}`,
                    {
                        chat_id: chatId,
                        message_id: query.message.message_id
                    }
                ).catch(() => {});

                return;

            }


            database.usuariosAprovados.push(novoUserId);

            database.solicitacoes =
                database.solicitacoes.filter(
                    id => id !== novoUserId
                );

            salvarDatabase();


            await bot.sendMessage(chatId,
                `✅ Usuário ${novoUserId} aprovado com sucesso.`
            );


            await bot.sendMessage(novoUserId,
                '✅ Seu acesso foi aprovado!\n\nUse /start para abrir o menu.'
            ).catch(() => {});


            await bot.editMessageText(
                `✅ Pedido aprovado

🆔 ID: ${novoUserId}`,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id
                }
            ).catch(() => {});

            return;

        }


        // RECUSAR USUÁRIO PELO BOTÃO
        if (data.startsWith('recusar_')) {

            if (!isAdmin(userId)) return;

            const novoUserId = Number(data.replace('recusar_', ''));


            if (!novoUserId) {

                return bot.sendMessage(chatId,
                    '❌ ID inválido.');
            }


            database.solicitacoes =
                database.solicitacoes.filter(
                    id => id !== novoUserId
                );

            salvarDatabase();


            await bot.sendMessage(chatId,
                `❌ Usuário ${novoUserId} recusado.`
            );


            await bot.sendMessage(novoUserId,
                '❌ Sua solicitação de acesso foi recusada.'
            ).catch(() => {});


            await bot.editMessageText(
                `❌ Pedido recusado

🆔 ID: ${novoUserId}`,
                {
                    chat_id: chatId,
                    message_id: query.message.message_id
                }
            ).catch(() => {});

            return;

        }


        // RECEBER LISTA
        if (data === 'receber_lista') {

            return entregarLista(chatId, userId);

        }


        // STATUS
        if (data === 'status') {

            if (!isAdmin(userId)) return;

            return enviarMensagemGrande(
                chatId,
                gerarStatus()
            );

        }


        // MEU ID
        if (data === 'meu_id') {

            return bot.sendMessage(chatId,
                `Seu ID é:\n\n${userId}`);

        }


        // LOGS
        if (data === 'logs') {

            if (!isAdmin(userId)) return;

            return enviarMensagemGrande(
                chatId,
                gerarLogs()
            );

        }


        // USUÁRIOS
        if (data === 'usuarios') {

            if (!isAdmin(userId)) return;

            return enviarMensagemGrande(
                chatId,
                `👥 Usuários aprovados:\n\n${database.usuariosAprovados.join('\n') || 'Nenhum'}`
            );

        }


        // PENDENTES
        if (data === 'pendentes') {

            if (!isAdmin(userId)) return;

            return enviarMensagemGrande(
                chatId,
                `📥 Pendentes:\n\n${database.solicitacoes.join('\n') || 'Nenhum'}`
            );

        }


    } catch (error) {

        console.log('Erro no botão:', error.message);

        bot.sendMessage(chatId,
            '❌ Ocorreu um erro ao processar sua solicitação.'
        ).catch(() => {});

    }

});


// ERROS DE POLLING
bot.on('polling_error', (error) => {

    console.log('Erro de polling:', error.message);

});


console.log('Bot ligado!');