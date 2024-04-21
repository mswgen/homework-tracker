import { MongoClient } from "mongodb";
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { PasskeySerialized } from "@/app/types";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const token = request.headers.get('Authorization');
    if (!token) {
        return new Response(JSON.stringify({ code: 1, msg: '로그인이 필요합니다.' }), { status: 401 });
    }

    const client = new MongoClient(process.env.MONGO!);
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const tokensCollection = db.collection('tokens');
    const tokenData = await tokensCollection.findOne({ token });
    if (!tokenData) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 토큰입니다.' }), { status: 401 });
    }

    const id = tokenData.id;
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ id });
    if (!user) {
        client.close();
        return new Response(JSON.stringify({ code: 1, msg: '유효하지 않은 ID입니다.' }), { status: 404 });
    }
    const registeredPasskeys: PasskeySerialized[] = user.passkeys;
    const options = await generateRegistrationOptions({
        rpName: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
        rpID: new URL('/', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000').hostname,
        userName: id,
        userDisplayName: id,
        attestationType: 'none',
        excludeCredentials: registeredPasskeys.map(passkey => ({
            id: passkey.credentialID,
            // @ts-ignore
            type: 'public-key',
            transports: passkey.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'required',
            requireResidentKey: true
        }
    });

    await usersCollection.updateOne({ id }, { $set: { currentChallenge: options.challenge } });
    client.close();
    return new Response(JSON.stringify({ code: 0, id, options }), { status: 200 });
}