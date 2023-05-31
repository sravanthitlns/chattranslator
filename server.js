const https = require('https');
const fs = require('fs');

// const { Translate } = require('@aws-sdk/client-translate');
// require('dotenv').config();

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const axios = require('axios');
// const fetch = require('node-fetch');

// Configure the AWS Translate client
// const translateService = new Translate({ 
//     region: process.env.AWS_REGION,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//     }
// });
const app = express();

// Local ssl certificates
const privateKey = fs.readFileSync('ssl/_localhost.key', 'utf8');
const certificate = fs.readFileSync('ssl/_localhost.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

app.use(cors());
app.use(express.static('docs'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const CLIENT_ID = 'e29ba9d3-1058-4597-9901-faee2e259ee6';
const CLIENT_SECRET = '61UeIlGqyCraVOPBJ/quhiKHG2hr]7:-';
const RESOURCE = 'e29ba9d3-1058-4597-9901-faee2e259ee6';
let token = '';
let PORT = process.env.PORT || 443;

const httpsServer = https.createServer(credentials, app);

const getBearerToken = async () => {
  try {
    let res = await axios("https://login.microsoftonline.com/e0793d39-0939-496d-b129-198edd916feb/oauth2/token", {
      method: "POST",
      data: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&resource=${RESOURCE}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log("Token Generated");
    return res.data;
    
  } catch (e) {
    console.log(e.data.message);
  }
};

const translateHandler = async (params) => {
    try {
        let bodyTemplate = JSON.stringify({
            "TranslationEngine":"aws",
            "TextInput":[      
                { 
                    "InputID":"12131",
                    "InputText":`${params.Text}`,
                    "SourceLanguage":`${params.SourceLanguageCode}`,
                    "OutputLanguage": `${params.TargetLanguageCode}`        
                }
            ]
        })
        let res = await axios({
            method: 'post',
            url: `https://apigatewayazeu.accenture.com/taas/test/v1/TranslateText`,
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            data: bodyTemplate
          })

          return res;
    } catch(err){
        console.log(err)
    }
}
app.post('/translate', async (req, res) => {
    const body = req.body;
    const params = {
      Text: body.raw_text,
      SourceLanguageCode: body.source_language,
      TargetLanguageCode: body.target_language
    };

    let response_token = await getBearerToken();
    token = response_token.access_token;
    console.log('---')
    console.log(params)
    let response_translate = await translateHandler(params)

    // Use the translate service
    // translateService.translateText(params)
    // .then((data) =>{
    //     let statusCode = data['$metadata'].httpStatusCode;
    //     let translatedText = data.TranslatedText;

    //     res.status(statusCode).json({ 
    //         source_language: data.SourceLanguageCode,
    //         translated_text: translatedText
    //     });
    // })
    // .catch(err => {
    //     console.error(err);
    //     res.status(400);
    // });
    let response_obj = {
      source_language: response_translate.data.Response[0].SourceLanguage,
      translated_text: response_translate.data.Response[0].OutputText
    }
    res.send(response_obj)
    // res.send(response_translate.data.Response[0])
});


httpsServer.listen(PORT);
console.log(`HTTPS listening on: ${PORT}`);
