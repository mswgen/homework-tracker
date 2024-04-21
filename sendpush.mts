import { MongoClient } from "mongodb";
import webpush from "web-push";
const { sendNotification, setVapidDetails } = webpush;
import { postType, deadlineName } from "./app/types.js";
import dotenv from "dotenv";

const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: [`.env.${NODE_ENV}.local`, `.env.${NODE_ENV}`, '.env'] });

const client = new MongoClient(process.env.MONGO!);
// @ts-ignore
await client.connect();
const db = client.db(process.env.DB_NAME);
const usersCollection = db.collection('users');
// @ts-ignore
const userList = await usersCollection.find().toArray();
const postsCollection = db.collection('posts');
// @ts-ignore
const allPosts = await postsCollection.find().toArray();
const twoDaysLeft = allPosts.filter(post => post.deadline && new Date(post.deadline) as unknown as number - Date.now() <= 2 * 24 * 60 * 60 * 1000 && new Date(post.deadline) as unknown as number - Date.now() > 24 * 60 * 60 * 1000);
const oneDayLeft = allPosts.filter(post => post.deadline && new Date(post.deadline) as unknown as number - Date.now() <= 24 * 60 * 60 * 1000 && new Date(post.deadline) as unknown as number - Date.now() > 0);
setVapidDetails(`mailto:${process.env.VAPID_EMAIL}`, process.env.NEXT_PUBLIC_VAPID_PUBKEY!, process.env.VAPID_PRIVKEY!);
const data = twoDaysLeft.map(post => {
    return {
        title: `${postType[post.type]} ${deadlineName[post.type]} 2일 전`,
        body: `${post.title} ${deadlineName[post.type]} 2일 전입니다.`,
        tag: post.count.toString()
    }
}).concat(oneDayLeft.map(post => {
    return {
        title: `${postType[post.type]} ${deadlineName[post.type]} 1일 전`,
        body: `${post.title} ${deadlineName[post.type]} 1일 전입니다.`,
        tag: post.count.toString()
    }
}));
userList.forEach(user => {
    user.subscriptions.forEach(async (sub: any) => {
        sendNotification(sub, JSON.stringify(data)).catch(() => {})
    });
});
client.close();