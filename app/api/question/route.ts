import { MongoClient } from "mongodb";
import { sendNotification, setVapidDetails } from "web-push";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const tokensCollection = db.collection('tokens');
    const token = request.headers.get('Authorization');
    if (!token) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '로그인이 필요합니다.' }), { status: 401 });
    }
    const tokenToUser = await tokensCollection.findOne({ token });
    if (!tokenToUser) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 토큰입니다.' }), { status: 401 });
    }
    const user = tokenToUser.id;
    const usersCollection = db.collection('users');
    const userData = await usersCollection.findOne({ id: user });
    if (!userData) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 사용자입니다.' }), { status: 401 });
    }
    if (!userData.accepted) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '승인 대기 중입니다.' }), { status: 403 });
    }
    const questionsCollection = db.collection('questions');
    const questions = (userData.answerer || userData.perm === 0) ? await questionsCollection.find().toArray() : await questionsCollection.find({ "$or": [{ user }, { public: true }] }).toArray();
    client.close();
    return new Response(JSON.stringify({ questions }), { status: 200 });
}

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
    const tokenToUser = await tokensCollection.findOne({ token });
    if (!tokenToUser) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 토큰입니다.' }), { status: 401 });
    }
    const user = tokenToUser.id;
    const usersCollection = db.collection('users');
    const userData = await usersCollection.findOne({ id: user });
    if (!userData) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 사용자입니다.' }), { status: 401 });
    }
    if (!userData.accepted) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '승인 대기 중입니다.' }), { status: 403 });
    }
    const data = await request.json();
    const questionsCollection = db.collection('questions');
    const prevQuestions = await questionsCollection.find().toArray();
    const question = {
        idx: prevQuestions.length === 0 ? 1 : prevQuestions.sort((a, b) => b.idx - a.idx)[0].idx + 1,
        user,
        title: data.title,
        public: data.public,
        question: data.question,
        solved: false,
        created: new Date()
    };
    await questionsCollection.insertOne(question);
    client.close();
    setVapidDetails(`mailto:${process.env.VAPID_EMAIL!}`, process.env.NEXT_PUBLIC_VAPID_PUBKEY!, process.env.VAPID_PRIVKEY!);
    const answerers = await usersCollection.find({ answerer: true }).toArray();
    answerers.forEach(async (answerer) => {
        answerer.subscriptions.forEach(async (sub: any) => {
            sendNotification(sub, JSON.stringify([{
                title: '질문 등록됨',
                body: `${question.title}이(가) 등록되었습니다.`,
                tag: question.idx.toString()
            }])).catch(() => { });
        });
    });
    return new Response(JSON.stringify({ code: 0, idx: question.idx }), { status: 200 });
}