const TelegramBot = require('node-telegram-bot-api');

const token = '8594892663:AAF1EvbkgMn7kRW1AXM5c75BQyyPLXMlbQI';

const bot = new TelegramBot(token, {
    polling: true
});


// LOTES
const lotes = [

{
    numero: '001',
    usos: 0,
    contatos: `
71999999901
71999999902
71999999903
71999999904
71999999905
`
},

{
    numero: '002',
    usos: 0,
    contatos: `
71988888801
71988888802
71988888803
71988888804
71988888805
`
},

{
    numero: '003',
    usos: 0,
    contatos: `
71977777701
71977777702
71977777703
71977777704
71977777705
`
}

];


// COMANDO
bot.onText(/\/lista/, async (msg) => {

    const chatId = msg.chat.id;

    
    // procura lote disponível
    const lote = lotes.find(l => l.usos < 2);


    // se não existir mais lote
    if (!lote) {
        return bot.sendMessage(chatId,
            '❌ Todas as listas foram esgotadas, aguarde atualização.');
    }


    // aumenta uso
    lote.usos++;


    // conta contatos
    const totalContatos = lote.contatos
        .trim()
        .split('\n')
        .length;


    // mensagem organizada
    await bot.sendMessage(chatId,
`✅ Lista entregue com sucesso!

📦 Lote: ${lote.numero}
📊 Total de contatos: ${totalContatos}

📨 Enviando a lista no chat...`
    );


    // envia contatos
    await bot.sendMessage(chatId, lote.contatos);

});

console.log('Bot ligado!');