const fs = require('fs');

const pasta = './lotes';

const arquivos = fs.readdirSync(pasta);

let numeroAtual = 71999900000;


arquivos.forEach(arquivo => {

    let conteudo = '';

    // 50 números por lote
    for (let i = 0; i < 50; i++) {

        conteudo += numeroAtual + '\n';

        numeroAtual++;

    }

    fs.writeFileSync(
        `${pasta}/${arquivo}`,
        conteudo
    );

});


console.log('Todos os lotes foram preenchidos!');