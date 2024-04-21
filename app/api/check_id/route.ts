import { MongoClient } from "mongodb";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ code: 1, msg: 'ID를 입력하세요.' }), { status: 400 });
    }
    if (id.length < 4 || id.length > 20) {
        return new Response(JSON.stringify({ code: 1, msg: 'ID는 4자 이상 20자 이하로 입력하세요.' }), { status: 400 });
    }

    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('users');
    const user = await collection.findOne({ id });
    client.close();
    if (!user) {
        return new Response(JSON.stringify({ code: 1, msg: '입력한 ID는 존재하지 않습니다.' }), { status: 404 });
    } else {
        return new Response(JSON.stringify({ code: 0, id: user.id }), { status: 200 });
    }
}