const functions = require("firebase-functions");
const fetch = require("node-fetch");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onRequest } = require("firebase-functions/v2/https");

initializeApp();
const db = getFirestore();

const SERVICE_KEY = "f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a";

// ── 날짜 유틸 ────────────────────────────────────────────────
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthsAgoString(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ── 공통 LH API 호출 (기존 fetchLeaseNotices 로직 그대로) ────
async function fetchLeaseNotices(params = {}) {
  const PAGE          = params.PAGE          || 1;
  const PG_SZ         = params.PG_SZ         || 100;
  const PAN_ST_DT     = params.PAN_ST_DT     || getMonthsAgoString(2);
  const PAN_ED_DT     = params.PAN_ED_DT     || getTodayString();
  const CNP_CD        = params.CNP_CD        || "";
  const PAN_SS        = params.PAN_SS        || "";
  const UPP_AIS_TP_CD = params.UPP_AIS_TP_CD || "05";

  const url =
    `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1` +
    `?serviceKey=${SERVICE_KEY}` +
    `&PAGE=${PAGE}&PG_SZ=${PG_SZ}` +
    `&PAN_ST_DT=${PAN_ST_DT}&PAN_ED_DT=${PAN_ED_DT}` +
    `&CNP_CD=${CNP_CD}&PAN_SS=${PAN_SS}` +
    `&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}` +
    `&_type=json`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API 호출 실패: ${response.status}`);

  const json = await response.json();

  // 기존 lhLeaseNotice HTTP Function과 동일한 응답 구조
  const resultBlock = json.find?.((block) => block.dsList);
  const header      = json.find?.((block) => block.resHeader)?.resHeader?.[0];

  // 응답이 배열이 아닌 경우 (공공데이터 API 직접 응답 구조 대응)
  if (!Array.isArray(json)) {
    const items = json?.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  if (header?.SS_CODE !== "Y") {
    throw new Error("API 응답 오류: " + JSON.stringify(header));
  }

  return resultBlock?.dsList ?? [];
}

// ════════════════════════════════════════════════════════════
// 1. 기존 HTTP Function — 변경 없이 그대로 유지
// ════════════════════════════════════════════════════════════
exports.lhLeaseNotice = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { PAGE = 1, PG_SZ = 30, PAN_ST_DT, PAN_ED_DT, CNP_CD, PAN_SS, UPP_AIS_TP_CD } = req.query;

  const url =
    `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1` +
    `?serviceKey=${SERVICE_KEY}` +
    `&PAGE=${PAGE}&PG_SZ=${PG_SZ}` +
    `&PAN_ST_DT=${PAN_ST_DT}&PAN_ED_DT=${PAN_ED_DT}` +
    `&CNP_CD=${CNP_CD}&PAN_SS=${PAN_SS}` +
    `&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}` +
    `&_type=json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════
// 2. 스케줄러 — 하루 2회 자동 변동 체크
// ════════════════════════════════════════════════════════════
// 오전 9시
// KST 오전 9시 (UTC 0시)
exports.checkLHNoticesAM = onSchedule(
  { schedule: "0 0 * * *" },   // timeZone 제거 — UTC 기본값 사용
  async () => { await runCheck(); }
);

// KST 오후 3시 (UTC 6시)
exports.checkLHNoticesPM = onSchedule(
  { schedule: "0 11 * * *" },
  async () => { await runCheck(); }
);

exports.testPush = onRequest(async (req, res) => {

  const source = req.method === "POST" ? req.body : req.query;
  const topic  = source.topic || "CNP_11"; // 기본값: 서울특별시
  const notice = {
    PAN_ID:  source.PAN_ID || "TEST123",
    PAN_NM: source.PAN_NM || "테스트 공고",
    CNP_CD: source.CNP_CD || "11",
    PAN_SS: source.PAN_SS || "공고중",
    AIS_TP_CD_NM: source.AIS_TP_CD_NM || "분양주택",
  };

  try {
    const result = await testPushNotification(topic, notice);

    res.json({
      success: true,
      topic,
      notice,
      messageId: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 공통 실행 함수
async function runCheck() {
  console.log("🔍 LH 공고 변동 체크 시작:", new Date().toISOString());
  try {
    const freshNotices = await fetchLeaseNotices({ PG_SZ: 100 });
    console.log(`📋 최신 공고 ${freshNotices.length}건 조회 완료`);

    const changes = await compareWithStored(freshNotices);
    console.log(`🆕 신규: ${changes.added.length}건 | 변경: ${changes.updated.length}건`);

    if (changes.added.length > 0 || changes.updated.length > 0) {
      await sendPushNotifications(changes);
      await updateStoredNotices(freshNotices);
    } else {
      console.log("✅ 변동 없음 — 스냅샷 유지");
    }

    await db.collection("check_logs").add({
      checkedAt:    new Date().toISOString(),
      totalFetched: freshNotices.length,
      added:        changes.added.length,
      updated:      changes.updated.length,
    });
  } catch (error) {
    console.error("❌ checkLHNotices 오류:", error);
  }
}

// ── 변동 비교 ────────────────────────────────────────────────
async function compareWithStored(freshNotices) {
  const snapshot = await db.collection("lh_notices_snapshot").get();

  const storedMap = {};
  snapshot.forEach((doc) => { storedMap[doc.id] = doc.data(); });

  const added   = [];
  const updated = [];

  for (const notice of freshNotices) {
    const id     = String(notice.PAN_ID);
    const stored = storedMap[id];

    if (!stored) {
      added.push(notice);
    } else if (
      stored.PAN_SS  !== notice.PAN_SS  ||   // 모집 상태 변경
      stored.CLSG_DT !== notice.CLSG_DT ||   // 마감일 변경
      stored.PAN_NM  !== notice.PAN_NM        // 공고명 변경
    ) {
      updated.push({ before: stored, after: notice });
    }
  }

  return { added, updated };
}

// ── FCM 발송 ─────────────────────────────────────────────────
async function sendPushNotifications(changes) {
  const messaging = getMessaging();
  const sends = [];

  // 신규 공고 알림 — 공고의 지역코드(CNP_CD) 토픽으로 발송
  for (const notice of changes.added) {

    if (!notice.CNP_CD) {
      continue; // 지역코드 없는 경우 스킵
    }

    const topic = `CNP_${notice.CNP_CD}`;
    sends.push(
      messaging.send({
        topic,
        notification: {
          title: "🏠 새 LH 분양 공고",
          body:  notice.PAN_NM || "새로운 공고가 등록되었습니다.",
        },
        data: {
          type:     "new_notice",
          noticeId: String(notice.PAN_ID),
          cnpCd:    String(notice.CNP_CD),
          panSs:    notice.PAN_SS || "",
        },
      }).catch((err) => {
        console.error(`❌ 토픽 발송 실패 (${topic}):`, err.message);
      })
    );
  }

  // 변경 공고 알림
  for (const { after } of changes.updated) {
    if (!after.CNP_CD) {
      continue; // 지역코드 없는 경우 스킵
    }
    const topic = `CNP_${after.CNP_CD}`;
    sends.push(
      messaging.send({
        topic,
        notification: {
          title: "📢 LH 공고 변경",
          body:  `${after.PAN_NM} — 상태가 변경되었습니다.`,
        },
        data: {
          type:     "updated_notice",
          noticeId: String(after.PAN_ID),
          cnpCd:    String(after.CNP_CD),
          panSs:    after.PAN_SS || "",
        },
      }).catch((err) => {
        console.error(`❌ 토픽 발송 실패 (${topic}):`, err.message);
      })
    );
  }

  await Promise.all(sends);
  console.log(`📲 토픽 발송 시도 ${sends.length}건 완료`);
}

// ----- Test Topic Push Notification 
async function testPushNotification(topic, notice) {
  const messaging = getMessaging();

  const message = {
    topic,
    notification: {
      title: "🏠 새 LH 분양 공고",
      body:  notice.PAN_NM || "새로운 공고가 등록되었습니다.",
    },
    data: {
      type:     "new_notice",
      noticeId: String(notice.PAN_ID),
      cnpCd:    String(notice.CNP_CD),
      panSs:    notice.PAN_SS || "",
    },
  };

  try {
    const result = await messaging.send(message);
    console.log(`📲 토픽 발송 성공 (${message.topic}):`, result);
    return result;
  } catch (error) {
    console.error(`❌ 토픽 발송 실패 (${message.topic}):`, error.message);
    throw error;
  }
} 

// ── Firestore 스냅샷 업데이트 (batch 400건씩) ────────────────
async function updateStoredNotices(freshNotices) {
  const CHUNK = 400;
  for (let i = 0; i < freshNotices.length; i += CHUNK) {
    const batch = db.batch();
    freshNotices.slice(i, i + CHUNK).forEach((notice) => {
      const ref = db.collection("lh_notices_snapshot").doc(String(notice.PAN_ID));
      batch.set(ref, { ...notice, _savedAt: new Date().toISOString() });
    });
    await batch.commit();
  }
  console.log(`💾 스냅샷 ${freshNotices.length}건 저장 완료`);
}

exports.getLeaseNoticeDtlInfo1 = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { SPL_INF_TP_CD, CCR_CNNT_SYS_DS_CD, PAN_ID, UPP_AIS_TP_CD, AIS_TP_CD } = req.query;

  const url = `http://apis.data.go.kr/B552555/lhLeaseNoticeDtlInfo1/getLeaseNoticeDtlInfo1?serviceKey=${SERVICE_KEY}&SPL_INF_TP_CD=${SPL_INF_TP_CD}&CCR_CNNT_SYS_DS_CD=${CCR_CNNT_SYS_DS_CD}&PAN_ID=${PAN_ID}&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}&AIS_TP_CD=${AIS_TP_CD}&_type=json`;


  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.checkLHNotices = onSchedule( 
  {
    schedule: "0 9, 21 * * *", // 매일 9시, 21시에 실행
    timeZone: "Asia/Seoul",
  },
  async (event) => {
    console.log("🔍 LH 공고 변동 체크 시작");

    try {
      const freshNotices = await fetchLHNotices();

      const changes = await compareWithStored(freshNotices);

      if (changes.added.length > 0 || changes.updated.length > 0) {
        await sendPushNotifications(changes);
        await updateStoredNotices(freshNotices);
        console.log(`✅ 변동 감지: 신규 ${changes.added.length}건, 변경 ${changes.updated.length}건`);
      } else {
        console.log("✅ 변동 없음");
      }
    } catch (error) {
      console.error("❌ 변동 체크 중 오류 발생:", error);
    }
  }
);