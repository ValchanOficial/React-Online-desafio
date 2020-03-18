const fetch = require("node-fetch");
const express = require('express');
const fs = require('fs');
const sha1 = require('js-sha1');
const FormData = require('form-data');

const app = express();
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const token = 'Uma calopsita esteve aqui e levou meu token'; // necessário alterar para testar
const getURL = 'https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=';
const submitURL = 'https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=';

function cipher(res, isDeciphered) {
    const value = res.numero_casas;
    const text = res.cifrado;
    let result = {
        numero_casas: value,
        token: res.token,
        cifrado: text,
        decifrado: '',
        resumo_criptografico: ''
    };
    
	let y;
    result.decifrado = text.split('').map((singleLetter) => {
        y = singleLetter.charCodeAt(0);
      	if (y >= 65 && y <= 90) { // UpperCase
        	return isDeciphered ? String.fromCharCode(y + value) : String.fromCharCode(y - value);
        }
        if (y >= 97 && y <= 122){ // LowerCase
            return isDeciphered ? String.fromCharCode(y + value) : String.fromCharCode(y - value);
        }
      	if(y < 64) { // Others
          return String.fromCharCode(y)
        }
    }).join('');

    return result;
}

function generateFile(data) {
    console.log('Creating!');
    fs.writeFileSync('answer.json', JSON.stringify(data), (err) => {
        if (err) throw err;
    });
}

async function readFile() {
    const file = await JSON.parse(fs.readFileSync('answer.json','utf8'));
    return file;
}

async function updateFile(data) {
    console.log('Updating!');
    let file = await readFile();
    file.decifrado = data.decifrado;
    fs.writeFileSync('answer.json', JSON.stringify(file), (err) => {
        if (err) throw err;
    });
}

async function generateSha1(params) {
    console.log('SHA1 + Updating!');
    let file = await readFile();
    file.resumo_criptografico = await sha1(file.decifrado);
    fs.writeFileSync('answer.json', JSON.stringify(file), (err) => {
        if (err) throw err;
    });
}

async function getFormData() {
    const form = await new FormData();
    await form.append('answer', fs.createReadStream('answer.json'));
    return form;
}

app.get('/answer', async (req, res) => {
    const response = await fetch(`${getURL}${token}`).then(res => res.json());
    await generateFile(response);
    await updateFile(cipher(response, false));
    await generateSha1();
    const content = await readFile();
    res.json(content);
});

app.post('/answer', async (req, res) => {
    const response = await fetch(`${submitURL}${token}`,{
        method: 'POST',
        body: await getFormData()
    }).then(res => res.json());
    res.json(response);
});

app.listen(PORT, () => {
    console.log(`Server is up and running on port: ${PORT}`);
});

// https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt
