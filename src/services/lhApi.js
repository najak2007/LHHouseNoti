import { getTodayString, getMonthsAgoString } from "../utils/dateUtils";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';
const db = getFirestore();

export async function fetchLeaseNotices(params = {}) {
    const PAGE = params.PAGE || 1;
    const PG_SZ = params.PG_SZ || 30;
    const PAN_ST_DT = params.PAN_ST_DT ? params.PAN_ST_DT.replace(/[-.]/g, "") : getMonthsAgoString(2);
    const PAN_ED_DT = params.PAN_ED_DT ? params.PAN_ED_DT.replace(/[-.]/g, "") : getTodayString();
    const CNP_CD = params.CNP_CD ? params.CNP_CD : "";
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


export async function fetchLeaseNoticeDetail(params = {}) {
    const SPL_INF_TP_CD = params.SPL_INF_TP_CD || "01"; // 추가: 상세유형 필터
    const CCR_CNNT_SYS_DS_CD = params.CCR_CNNT_SYS_DS_CD || "01"; // 추가: 시스템구분 필터
    const PAN_ID = params.PAN_ID || "";
    const UPP_AIS_TP_CD = params.UPP_AIS_TP_CD || "05"; // 추가: 공고유형 필터
    const AIS_TP_CD = params.AIS_TP_CD || "01"; // 추가: 공고유형 필터

    const url = `https://us-central1-lhhousenoti.cloudfunctions.net/getLeaseNoticeDtlInfo1?serviceKey=${SERVICE_KEY}&SPL_INF_TP_CD=${SPL_INF_TP_CD}&CCR_CNNT_SYS_DS_CD=${CCR_CNNT_SYS_DS_CD}&PAN_ID=${PAN_ID}&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}&AIS_TP_CD=${AIS_TP_CD}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
    }

    return await response.json();
}
