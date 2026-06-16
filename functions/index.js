const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

exports.lhLeaseNotice = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';
  const { PAGE = 1, PG_SZ = 30, PAN_ST_DT, PAN_ED_DT, CNP_CD, PAN_SS, UPP_AIS_TP_CD } = req.query;

  const url = `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?serviceKey=${SERVICE_KEY}&PAGE=${PAGE}&PG_SZ=${PG_SZ}&PAN_ST_DT=${PAN_ST_DT}&PAN_ED_DT=${PAN_ED_DT}&CNP_CD=${CNP_CD}&PAN_SS=${PAN_SS}&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}&_type=json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.noticeDetail = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url 파라미터가 필요합니다." });
  }

  if (!url.startsWith("https://apply.lh.or.kr/")) {
    return res.status(403).json({ error: "허용되지 않은 도메인입니다." });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeaseNoticeBot/1.0)" }
    });

    if (!response.ok) {
      throw new Error(`상태 코드: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // ✨ 공고내용 (pre 태그 안의 텍스트)
    const noticeContent = $("pre").first().text().trim();

    // ✨ 테이블을 [{헤더, 행 배열}] 형태로 추출하는 헬퍼
    const extractTable = ($table) => {
      const headers = [];
      $table.find("thead th, tr:first-child th").each((_, th) => {
        headers.push($(th).text().trim());
      });

      const rows = [];
      $table.find("tbody tr, tr").each((i, tr) => {
        const $tr = $(tr);
        if ($tr.find("th").length > 0 && headers.length > 0 && i === 0) return; // 헤더 행 스킵
        const cells = [];
        $tr.find("td, th").each((_, cell) => {
          cells.push($(cell).text().trim());
        });
        if (cells.length > 0) rows.push(cells);
      });

      return { headers, rows };
    };

    const tables = [];
    $("table").each((_, table) => {
      const extracted = extractTable($(table));
      if (extracted.rows.length > 0) tables.push(extracted);
    });

    res.json({
      noticeContent,
      tables, // [0]: 공급정보 또는 주택형 안내, [1]: 다음 표, 순서대로
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});