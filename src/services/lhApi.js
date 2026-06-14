import { getTodayString, getMonthsAgoString } from "../utils/dateUtils";
import { getLocationCode } from "../utils/locationUtils"; 

const BASE_URL = "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';

export async function fetchLeaseNotices({ PAGE = 1, PG_SZ = 10, PAN_ST_DT = getMonthsAgoString(2), PAN_ED_DT = getTodayString(), locationName = "서울" } = {}) {
    const CNP_CD = getLocationCode(locationName);

    const url = `https://us-central1-lhhousenoti.cloudfunctions.net/lhLeaseNotice?serviceKey=${SERVICE_KEY}&PAGE=${PAGE}&PG_SZ=${PG_SZ}&PAN_ST_DT=${PAN_ST_DT}&PAN_ED_DT=${PAN_ED_DT}&CNP_CD=${CNP_CD}`;

    const response = await fetch(url);

    if(!response.ok) {
        throw new Error('API 호출 실패: ${response.status}');
    }
    const json = await response.json()

    const resultBlock = json.find((block) => block.dsList);
    const header = json.find((block) => block.resHeader)?.resHeader?.[0];

    if (header?.SS_CODE !== "Y") {
        throw new Error("API 응답 오류: " + JSON.stringify(header));
    }

    return resultBlock?.dsList ?? [];
}