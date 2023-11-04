import { connect } from "vectordb";

export default async function GET(request, response) {
    try {
      const db = await connect(process.env.lanceDB_URI);
      const table = await db.tableNames()
      response.json({ success: true, data:table })
    } catch (e) {
      response.json({ success: false, error: "Error :" + e })
    }
  }