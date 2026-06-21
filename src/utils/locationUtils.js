/**
 *   지역이름 입력 시 지역 코드 반환
 *   @param { location }  지역명 : 서울특별시, 부산광역시, 대구광역시 ...
 *   @returns { string }  지역 코드 예 : 서울특별시 == "11", 부산광역시 == "26"
 */

export function getLocationCode(location = "서울") {
    switch(location) {
        case "서울":
            return "11";
        case "부산":
            return "26";
        case "대구":
            return "27";
        case "인천":
            return "28";
        case "광주":
            return "29";
        case "대전":
            return "30";
        case "울산":
            return "31";
        case "세종":
            return "36110";
        case "경기":
            return "41";
        case "강원":
            return "42";
        case "충북":
            return "43";
        case "충남":
            return "44";
        case "전북":
            return "52";
        case "전남":
            return "46";
        case "경북":
            return "47";
        case "경남":
            return "48";
        case "제주":
            return "50";
        default:
            return ""; // 기본값은 서울로 설정
    }
}

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