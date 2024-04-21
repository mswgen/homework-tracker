import { MongoClient } from "mongodb";
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const sessionsCollection = db.collection('loginSessions');
    const options = await generateAuthenticationOptions({
        rpID: new URL('/', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000').hostname,
        userVerification: 'required'
    });
    let session = '';
    while (true) {
        for (let i = 0; i < 64; i++) {
            session += Math.floor(Math.random() * 16).toString(16);
        }
        if (!await sessionsCollection.findOne({ session })) break;
    }
    await sessionsCollection.insertOne({ session, challenge: options.challenge });
    return new Response(JSON.stringify({ code: 0, session, options }), { status: 200 });
}