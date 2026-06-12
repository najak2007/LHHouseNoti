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
        case "경기도":
            return "41";
        case "강원도":
            return "42";
        case "충청북도":
            return "43";
        case "충청남도":
            return "44";
        case "전북특별자치도":
            return "52";
        case "전라남도":
            return "46";
        case "경상북도":
            return "47";
        case "경상남도":
            return "48";
        case "제주특별자치도":
            return "50";
    }
}