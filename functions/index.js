const functions = require("firebase-functions");
const fetch = require("node-fetch");

exports.lhLeaseNotice = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const SERVICE_KEY = 'f471c3a21df119bf22449a724bf67affb5f3387c2f29c661cda32b4b5031169a';
  const { pageNo = 1, numOfRows = 10, startDate, endDate } = req.query;

  const url = `http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1?serviceKey=${SERVICE_KEY}&PAGE=${pageNo}&PG_SZ=${numOfRows}&PAN_ST_DT=${startDate}&PAN_ED_DT=${endDate}&_type=json`;

  try {
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});