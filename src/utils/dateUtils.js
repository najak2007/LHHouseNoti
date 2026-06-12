/**
 *   Date 객체를 yyyyMMdd 형식의 문자열로 변환
 *   @param { Date } date 
 *   @returns { string } 예: "20260612"
 */

function formatToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

/**
 *   현재 날짜를 yyyyMmdd 형식으로 반환
 *   @returns { string } 예: "20260612" 
 */
export function getTodayString() {
    return formatToYYYYMMDD(new Date());
}

/**
 *   현재 날짜에서 N개월 전 날짜를 yyyyMMdd 형식으로 반환
 *   @param { number } months  - 몇 개월 전 (기본값: 2)
 *   @param { string } 예: "20260412"
 */
export function getMonthsAgoString(months = 2) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return formatToYYYYMMDD(date);
}

