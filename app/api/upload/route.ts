import { MongoClient } from "mongodb";
import fs from 'node:fs/promises';
import path from 'node:path';
const crypto = globalThis.crypto;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const tokensCollection = db.collection('tokens');
    const token = request.headers.get('Authorization');
    if (!token) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '로그인이 필요합니다.' }), { status: 401 });
    }
    const tokenData = await tokensCollection.findOne({ token });
    if (!tokenData) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 토큰입니다.' }), { status: 401 });
    }
    const usersCollection = db.collection('users');
    const userData = await usersCollection.findOne({ id: tokenData.id });
    if (!userData) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 사용자입니다.' }), { status: 401 });
    }
    if (!userData.accepted) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '승인 대기 중입니다.' }), { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '파일을 첨부하세요.' }), { status: 400 });
    }
    if (file.size > 1024 * 1024 * Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT_MIB)) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: `${process.env.NEXT_PUBLIC_UPLOAD_LIMIT_MIB}MiB 이하의 파일만 업로드할 수 있습니다.` }), { status: 400 });
    }
    if (!file.name || file.name === '') {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '파일 이름을 입력하세요.' }), { status: 400 });
    }
    const fileArrayBuffer = await file.arrayBuffer();
    const hash = Buffer.from(await crypto.subtle.digest('SHA-1', fileArrayBuffer)).toString('hex');
    try {
        await fs.stat('./upload');
    } catch {
        await fs.mkdir('./upload');
    }
    const filePath = await fs.readdir('./upload').then(files => files.find(fileName => fileName.includes(hash)));
    if (!filePath) {
        await fs.writeFile(`./upload/${hash}${path.parse(file.name).ext}`, Buffer.from(fileArrayBuffer));
    }
    client.close();
    return new Response(JSON.stringify({ code: 0, path: `/upload/${filePath ?? `${hash}${path.parse(file.name).ext}`}` }), { status: 200 });
}