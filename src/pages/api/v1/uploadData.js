import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { connect } from "vectordb";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { LanceDB } from "langchain/vectorstores/lancedb";
import { TextLoader } from "langchain/document_loaders/fs/text";


export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb' 
        }
    }
}

function makeValidString(inputString) {
    const pattern = /^[a-z0-9-]+$/;
    const lowerCaseString = inputString.toLowerCase();
    const cleanedString = lowerCaseString.replace('.pdf', '');
    const validCharacters = [];
    for (const char of cleanedString) {
        if (pattern.test(char)) {
            validCharacters.push(char);
        } else if (char === ' ') {
            validCharacters.push('-');
        }
    }
    const validString = validCharacters.join('');
    return validString;
}

function determineLoader(type, context, res) {
    let file;
    switch (type) {
        case 'application/pdf':
            file = new Blob([context], { type: 'application/pdf' })
            return new PDFLoader(file);
        case 'application/csv':
            file = new Blob([context], { type: 'application/csv' })
            return new CSVLoader(file);
        case 'text/plain':
            file = new Blob([context], { type: 'text/plain' })
            return new TextLoader(file);
        case 'application/raw-text':
            return new TextLoader(context);
        default:
            // Handle unsupported file types
            res.json({ success: false, error: "Unsupported file type" });
    }
}


export default async function POST(req, res) {
    try {
        let base64FileString, fileName, fileType, tableName, buffer;

        if (req.body.isFile) {
            base64FileString = req.body.file;
            fileName = req.body.fileName;
            buffer = Buffer.from(base64FileString, 'base64');
        }

        tableName = req.body.isFile ?makeValidString(fileName):fileName;
        fileType = req.body.fileType;

        const context = req.body.isFile ? buffer : req.body.input
        const loader = await determineLoader(fileType, context, res)
        const splitDocuments =  await loader.loadAndSplit()
        const pageContentList = [];
        const metaDataList = [];

        if (splitDocuments.length > 0) {
            splitDocuments?.forEach((item, index) => {
                pageContentList.push(item.pageContent);
                metaDataList.push({
                    id: index
                });
            });
        }
        const db = await connect(process.env.lanceDB_URI);
        const dataSchema = [
            { vector: Array(1536), text: fileType, id: 1 }
        ];

        const table = await db.createTable(tableName, dataSchema)

        await LanceDB.fromTexts(
            [...pageContentList],
            [...metaDataList],
            new OpenAIEmbeddings(),
            { table }
        );

        res.json({ success: true, doc:splitDocuments });
    } catch (err) {
        res.json({ success: false, error: "" + err });
    }
}



