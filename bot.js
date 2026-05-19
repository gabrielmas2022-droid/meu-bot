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
    usuarios: [],
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
    usuarios: [],
    contatos: `
71888888801
71888888802
71888888803
71888888804
71888888805
`
},

{
    numero: '003',
    usos: 0,
    usuarios: [],
    contatos: `
71777777701
71777777702
71777777703
71777777704
71777777705
`
}

];


// COMANDO
bot.onText(/\/lista/, async (msg) => {

    const chatId = msg.chat.id;
    const userId = msg.from.id;


    // procura lote disponível
    const loteDisponivel = lotes.find(lote => {

        // lote já atingiu limite
        if (lote.usos >= 2) {
            return false;
        }

        // usuário já recebeu esse lote
        if (lote.usuarios.includes(userId)) {
            return false;
        }

        return true;

    });


    // nenhum lote disponível
    if (!loteDisponivel) {

        return bot.sendMessage(chatId,
            '❌ Nenhuma lista disponível para você.');
    }


    // registra usuário
    loteDisponivel.usuarios.push(userId);

    // aumenta uso
    loteDisponivel.usos++;


    // total de contatos
    const totalContatos = loteDisponivel.contatos
        .trim()
        .split('\n')
        .length;


    // mensagem organizada
    await bot.sendMessage(chatId,

`✅ Lista entregue com sucesso!

📦 Lote: ${loteDisponivel.numero}
📊 Total de contatos: ${totalContatos}

📨 Enviando a lista no chat...`
    );


    // envia lista
    await bot.sendMessage(chatId, loteDisponivel.contatos);

});

console.log('Bot ligado!');