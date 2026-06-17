const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';

exports.lhLeaseNotice = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
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

exports.getLeaseNoticeDtlInfo1 = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { SPL_INF_TP_CD, CCR_CNNT_SYS_DS_CD, PAN_ID, UPP_AIS_TP_CD, AIS_TP_CD } = req.query;

  const url = `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/getLeaseNoticeDtlInfo1?serviceKey=${SERVICE_KEY}&SPL_INF_TP_CD=${SPL_INF_TP_CD}&CCR_CNNT_SYS_DS_CD=${CCR_CNNT_SYS_DS_CD}&PAN_ID=${PAN_ID}&UPP_AIS_TP_CD=${UPP_AIS_TP_CD}&AIS_TP_CD=${AIS_TP_CD}&_type=json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
