import { LanceDB } from "langchain/vectorstores/lancedb";
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { connect } from "vectordb";

export default async function POST(request, response) {
  try {
    const body = await request.body;
    const db = await connect(process.env.lanceDB_URI);
    const table = await db.openTable(body.index);
    const vectorStore = new LanceDB(new OpenAIEmbeddings(), { table });

    const model = new OpenAI({
      modelName: "gpt-3.5-turbo",
      // streaming: true,
      // callbackManager: CallbackManager.fromHandlers(handlers),
    });
    const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
      k: 1,
      returnSourceDocuments: true,
    });

    chain.call({ query: body.prompt })
    .then((res) => response.json({ success: true, message: res }))
    .catch(err => response.json({ success: false, error: "Error :" + err })).finally(err=>response.json({success:true, message:"resolved."}))
  } catch (e) {
    response.json({ success: false, error: "Error :" + e })
  }
}