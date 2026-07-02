/**
 *   지역이름 입력 시 지역 코드 반환
 *   @param { location }  지역명 : 서울특별시, 부산광역시, 대구광역시 ...
 *   @returns { string }  지역 코드 예 : 서울특별시 == "11", 부산광역시 == "26"
 */

export function uppAisTpCdToName(aisTpCode) {
    switch(aisTpCode) {
        case "05":
            return "분양 주택";
        case "06":
            return "임대 주택";
        case "01":
            return "토지";
        case "13":
            return "주거복지";
        case "22":
            return "상가";
        case "39":
            return "신혼 희망타운";
        default:
            return "분양 주택"; // 기본값은 분양주택으로 설정
    }
} 