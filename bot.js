const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = '8594892663:AAF1EvbkgMn7kRW1AXM5c75BQyyPLXMlbQI';

const ADMIN_ID = 8123986377;

const bot = new TelegramBot(token, {
    polling: true
});


// CARREGAR BANCO
let database = JSON.parse(
    fs.readFileSync('database.json')
);


// SALVAR BANCO
function salvarBanco() {

    fs.writeFileSync(
        'database.json',
        JSON.stringify(database, null, 2)
    );

}


// COMANDO LISTA
bot.onText(/\/lista/, async (msg) => {

    const chatId = msg.chat.id;
    const userId = msg.from.id;


    const lote = database.lotes.find(l => {

        if (l.usos >= 2) return false;

        if (l.usuarios.includes(userId)) return false;

        return true;

    });


    if (!lote) {

        return bot.sendMessage(chatId,
            '❌ Nenhum lote disponível.');
    }


    lote.usos++;
    lote.usuarios.push(userId);

    salvarBanco();


    await bot.sendMessage(chatId,

`✅ Lista entregue com sucesso!

📦 Lote: ${lote.numero}
📊 Total de contatos: ${lote.contatos.length}

📨 Enviando lista...`
    );


    await bot.sendMessage(
        chatId,
        lote.contatos.join('\n')
    );

});


// STATUS ADMIN
bot.onText(/\/status/, (msg) => {

    if (msg.from.id !== ADMIN_ID) {
        return;
    }


    let texto = `📊 STATUS DOS LOTES\n\n`;


    database.lotes.forEach(lote => {

        const restante = 2 - lote.usos;

        texto +=
`📦 Lote ${lote.numero}
✅ Usos: ${lote.usos}/2
📌 Restantes: ${restante}

`;

    });


    bot.sendMessage(msg.chat.id, texto);

});


// LOGS
bot.onText(/\/logs/, (msg) => {

    if (msg.from.id !== ADMIN_ID) {
        return;
    }


    let texto = `📜 LOGS DOS LOTES\n\n`;


    database.lotes.forEach(lote => {

        texto +=
`📦 Lote ${lote.numero}

👤 Usuários:
${lote.usuarios.join('\n') || 'Nenhum'}

`;

    });


    bot.sendMessage(msg.chat.id, texto);

});

console.log('Bot ligado!');