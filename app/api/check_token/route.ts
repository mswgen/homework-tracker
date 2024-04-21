import { MongoClient } from "mongodb";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const token = request.headers.get('Authorization');

    if (!token) {
        return new Response(JSON.stringify({ code: 1, msg: '토큰을 입력하세요.' }), { status: 400 });
    }
    if (token.length !== 64) {
        return new Response(JSON.stringify({ code: 1, msg: '올바른 토큰을 입력하세요.' }), { status: 400 });
    }

    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('tokens');
    const user = await collection.findOne({ token });
    client.close();
    if (!user) {
        return new Response(JSON.stringify({ code: 1, msg: '입력한 토큰은 존재하지 않습니다.' }), { status: 404 });
    } else {
        return new Response(JSON.stringify({ code: 0, id: user.id }), { status: 200 });
    }
}