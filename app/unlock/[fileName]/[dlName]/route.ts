import fs from 'node:fs/promises';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { fileName: string, dlName: string } }) {
    if (!(await fs.readdir('./upload/unlock')).includes(params.fileName)) {
        return new Response("Not Found", { status: 404 });
    }
    return new Response(await fs.readFile(`./upload/unlock/${params.fileName}`), { status: 200, headers: { 'Content-Type': 'application/octet-stream' /* for iOS Safari */ } });
}
