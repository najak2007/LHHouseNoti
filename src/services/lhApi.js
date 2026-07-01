import { getTodayString, getMonthsAgoString } from "../utils/dateUtils";
import { getLocationCode } from "../utils/locationUtils"; 
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";

const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';
const db = getFirestore();

// ── 스냅샷 비교 후 신규/변경 저장 ────────────────────────────
async function syncToSnapshot(freshNotices) {
  // 1. 기존 스냅샷 가져오기
  const snapshot = await getDocs(collection(db, "lh_notices_snapshot"));

  const storedMap = {};
  snapshot.forEach((doc) => { storedMap[doc.id] = doc.data(); });

  // 2. 신규/변경 공고 필터링
  const toUpdate = [];

  for (const notice of freshNotices) {
    const id     = String(notice.PAN_ID);
    const stored = storedMap[id];

    if (
      !stored ||
      stored.PAN_SS  !== notice.PAN_SS  ||
      stored.CLSG_DT !== notice.CLSG_DT ||
      stored.PAN_NM  !== notice.PAN_NM
    ) {
      toUpdate.push(notice);
    }
  }

  if (toUpdate.length === 0) {
    console.log("✅ 스냅샷 동기화 불필요 — 변동 없음");
    return;
  }

  // 3. Firestore batch 저장 (500건 제한 대비 400건씩)
  const CHUNK = 400;
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const batch = writeBatch(db);
    toUpdate.slice(i, i + CHUNK).forEach((notice) => {
      const ref = doc(db, "lh_notices_snapshot", String(notice.PAN_ID));
      batch.set(ref, {
        PAN_SS:   notice.PAN_SS  || "",
        CLSG_DT:  notice.CLSG_DT || "",
        PAN_NM:   notice.PAN_NM  || "",
        _savedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  }

  console.log(`💾 스냅샷 ${toUpdate.length}건 동기화 완료`);
}

// ── fetchLeaseNotices 호출 후 syncToSnapshot 연결 ─────────────
export async function fetchLeaseNoticesAndSync(params = {}) {
  const notices = await fetchLeaseNotices(params);
  
  // 화면 렌더링은 즉시, 스냅샷 동기화는 백그라운드로
  syncToSnapshot(notices).catch((err) =>
    console.error("❌ 스냅샷 동기화 오류:", err)
  );

  return notices;  // 기존과 동일하게 반환
}


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
