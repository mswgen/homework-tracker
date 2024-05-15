import fs from 'node:fs/promises';
import { lookup } from 'mime-types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { fileName: string } }) {
    if (!(await fs.readdir('./upload/image')).includes(params.fileName)) {
        return new Response("Not Found", { status: 404 });
    }
    return new Response(await fs.readFile(`./upload/image/${params.fileName}`), { status: 200, headers: { 'Content-Type': lookup(params.fileName) + '; charset=UTF-8' || 'application/octet-stream' } });
}
