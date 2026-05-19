const fs = require('fs');


// CONFIGURAÇÃO
const quantidadeLotes = 100;
const numerosPorLote = 50;

let numeroAtual = 71999900000;


// criar pasta lotes
if (!fs.existsSync('./lotes')) {
    fs.mkdirSync('./lotes');
}


// criar lotes
for (let i = 1; i <= quantidadeLotes; i++) {

    // nome do arquivo
    const nomeArquivo =
        String(i).padStart(3, '0') + '.txt';

    let conteudo = '';


    // adicionar números
    for (let j = 1; j <= numerosPorLote; j++) {

        conteudo += numeroAtual + '\n';

        numeroAtual++;

    }


    // salvar txt
    fs.writeFileSync(
        `./lotes/${nomeArquivo}`,
        conteudo
    );

}


console.log('Lotes criados com sucesso!');