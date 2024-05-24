import fetch from 'node-fetch'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    if (!process.env.MEAL_ATPT_OFCDC_SC_CODE || !process.env.MEAL_SD_SCHUL_CODE) {
        return new Response(JSON.stringify({ code: 1, msg: '서버에서 급식 정보를 설정하지 않았습니다.' }), { status: 500 });
    }
    const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?type=json&ATPT_OFCDC_SC_CODE=${process.env.MEAL_ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${process.env.MEAL_SD_SCHUL_CODE}&MLSV_YMD=${new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).split('.').map(x => x.trim().padStart(2, '0')).splice(0, 3).join('')}`);
    const data: any = await response.json();
    if (!data.mealServiceDietInfo) {
        return new Response(JSON.stringify({ code: 1, msg: '급식 정보를 가져올 수 없습니다.' }), { status: 404 });
    }
    const meal = data.mealServiceDietInfo[1].row.find((x: any) => x.MMEAL_SC_NM === '중식');
    return new Response(JSON.stringify({ data: { meals: meal.DDISH_NM.split('<br/>').map((x: string) => x.trim()), calories: Number(meal.CAL_INFO.toLowerCase().replace('kcal', '').trim()) }, code: 0 }), { status: 200 });
}