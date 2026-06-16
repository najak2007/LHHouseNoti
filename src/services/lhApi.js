import { getTodayString, getMonthsAgoString } from "../utils/dateUtils";
import { getLocationCode } from "../utils/locationUtils"; 

const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';

export async function fetchLeaseNotices(params = {}) {
    const PAGE = params.PAGE || 1;
    const PG_SZ = params.PG_SZ || 30;
    const PAN_ST_DT = params.PAN_ST_DT ? params.PAN_ST_DT.replace(/[-.]/g, "") : getMonthsAgoString(2);
    const PAN_ED_DT = params.PAN_ED_DT ? params.PAN_ED_DT.replace(/[-.]/g, "") : getTodayString();
    const CNP_CD = params.locationName ? getLocationCode(params.locationName) : "";
    const PAN_SS = params.PAN_SS || "";
    const UPP_AIS_TP_CD = params.UPP_AIS_TP_CD || "05"; // 추가: 공고유형 필터

    const url = `https://us-central1-lhhousenoti.cloudfunctions.net/lhLeaseNotice?serviceKey=${SERVICE_KEY}&PAGE=${PAGE}&PG_SZ=${PG_SZ}&PAN_ST_DT=${PAN_ST_DT}&PAN_ED_DT=${PAN_ED_DT}&CNP_CD=${CNP_CD}&PAN_SS=${PAN_SS}&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }
    const json = await response.json();

    const resultBlock = json.find((block) => block.dsList);
    const header = json.find((block) => block.resHeader)?.resHeader?.[0];

    if (header?.SS_CODE !== "Y") {
        throw new Error("API 응답 오류: " + JSON.stringify(header));
    }

    return resultBlock?.dsList ?? [];
}

export async function fetchNoticeDetail(detailUrl) {
    const url = `https://us-central1-lhhousenoti.cloudfunctions.net/noticeDetail?url=${encodeURIComponent(detailUrl)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`상세 정보 호출 실패: ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
        throw new Error(json.error);
    }

    return json; // { noticeContent, tables }
}