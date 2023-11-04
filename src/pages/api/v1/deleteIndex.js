import { connect } from "vectordb";

export default async function POST(request, response) {
    try {
        const indexName = request.body.index;
        const db = await connect(process.env.lanceDB_URI);
        await db.dropTable(indexName)
        response.json({ success: true })
    } catch (e) {
        response.json({ success: false, error: "Error :" + e })
    }
}