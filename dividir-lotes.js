const fs = require('fs');


// CONFIGURAÇÃO
const numerosPorLote = 50;


// ler numeros.txt
const numeros = fs.readFileSync(
    'numeros.txt',
    'utf8'
)
.split('\n')
.map(n => n.trim())
.filter(n => n !== '');


// criar pasta lotes
if (!fs.existsSync('./lotes')) {
    fs.mkdirSync('./lotes');
}


let lote = 1;


// dividir em lotes
for (let i = 0; i < numeros.length; i += numerosPorLote) {

    const numerosLote =
        numeros.slice(i, i + numerosPorLote);


    const nomeArquivo =
        String(lote).padStart(3, '0') + '.txt';


    fs.writeFileSync(
        `./lotes/${nomeArquivo}`,
        numerosLote.join('\n')
    );


    lote++;

}


console.log('Lotes criados com sucesso!');