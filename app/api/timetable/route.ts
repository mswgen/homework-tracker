import comcigan from 'comcigan.js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!process.env.COMCIGAN_SCHOOL || !process.env.COMCIGAN_GRADE || !process.env.COMCIGAN_CLASSNUM) {
        return new Response(JSON.stringify({ code: 1, msg: '서버에서 컴시간을 설정하지 않았습니다.' }), { status: 500 });
    }
    try {
        const timetable = await comcigan.getTimetable(Number(process.env.COMCIGAN_SCHOOL), Number(process.env.COMCIGAN_GRADE), Number(process.env.COMCIGAN_CLASSNUM));
        return new Response(JSON.stringify({ data: timetable, code: 0 }), { status: 200 });
    } catch (e) {
        if (e instanceof comcigan.TimetableError)
        return new Response(JSON.stringify({ code: e.errorCode, msg: e.message }), { status: 500 });
    }
}
