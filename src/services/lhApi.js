import { getTodayString, getMonthsAgoString } from "../utils/dateUtils";
import { getLocationCode } from "../utils/locationUtils"; 

const BASE_URL = "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const SERVICE_KEY = process.env.APP_DATA_LHHOUSE_NOTI_KEY;

export async function fetchLeaseNotices({ page = 1, perPage = 10, startDate = getMonthsAgoString(2), endDate = getTodayString(), locationName = "서울" } = {}) {
    const cnp_cd = getLocationCode(locationName);

    const url = `https://us-central1-lhhousenoti.cloudfunctions.net/lhLeaseNotice?pageNo=${page}&numOfRows=${perPage}`;

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