import { MongoClient } from "mongodb";

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
    const token = request.headers.get('Authorization');
    if (!token) {
        return new Response(JSON.stringify({ code: 1, msg: '로그아웃 상태입니다.' }), { status: 400 });
    }

    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection('tokens');
    const user = await collection.findOne({ token });

    if (!user) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '입력한 ID는 존재하지 않습니다.' }), { status: 404 });
    } else {
        await collection.deleteOne({ token });
        client.close();
        return new Response(JSON.stringify({ code: 0 }), { status: 200 });
    }
}