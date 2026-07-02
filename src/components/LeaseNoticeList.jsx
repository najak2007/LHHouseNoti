import { useEffect, useState } from "react";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import app from "../firebase";
import { fetchLeaseNotices, fetchLeaseNoticeDetail } from "../services/lhApi";
import { openNativeWebView } from "../utils/nativeBridge";
import { uppAisTpCdToName } from "../utils/locationUtils";
import "../css/LeaseNoticeList.css";

// ── Remote Config 기본값 (네트워크 지연/실패 대비) ────────────────────────────
const REMOTE_CONFIG_DEFAULTS = {
    location_names: JSON.stringify([
        "서울특별시:11", "부산광역시:26", "대구광역시:27", "인천광역시:28",
        "광주광역시:29", "대전광역시:30", "울산광역시:31", "세종특별자치시:36110",
        "경기도:41", "강원도:42", "충청북도:43", "충청남도:44",
        "전라북도:52", "전라남도:46", "경상북도:47", "경상남도:48",
        "제주특별자치도:50"
    ]),
    pass_names: JSON.stringify([
        "공고중:공고중", "접수중:접수중", "접수마감:접수마감",
        "상담요청:상담요청", "정정공고중:정정공고중"
    ]),
    uppaistpcd_names: JSON.stringify([
        "분양주택:05", "토지:01", "임대주택:06",
        "주거복지:13", "상가:22", "신혼희망타운:39"
    ])
};

function LeaseNoticeList() {
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    const [region, setRegion] = useState(""); // CNP_CD 코드값 (예: "11", "29")
    const [locationOptions, setLocationOptions] = useState([]); // Remote Config: location_names

    const [panss, setPanss] = useState("");
    const [panssOptions, setPanssOptions] = useState([]); // Remote Config: pass_names

    const [uppAisTpCd, setUppAisTpCd] = useState("05"); // 기본값: 분양주택
    const [uppAisTpCdOptions, setUppAisTpCdOptions] = useState([]); // Remote Config: uppaistpcd_names

    const [remoteConfigLoading, setRemoteConfigLoading] = useState(true); // 세 옵션 모두의 로딩 상태

    const [startDate, setStartDate] = useState(formatDate(twoMonthsAgo));
    const [endDate, setEndDate] = useState(formatDate(today));

    // 선택된 공고 (모달 오픈 여부 겸용)
    const [selectedNotice, setSelectedNotice] = useState(null);

    // fetchLeaseNoticeDetail 결과 및 로딩 상태
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // ── Remote Config에서 location_names, pass_names, uppaistpcd_names 로드 ────────────
    useEffect(() => {
        const remoteConfig = getRemoteConfig(app);
        remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1시간 (필요시 조정)
        remoteConfig.defaultConfig = REMOTE_CONFIG_DEFAULTS; // 지연/실패 시 기본값 사용

        const applyOptions = (source) => {
            const parsedLocations = JSON.parse(source.location_names);
            setLocationOptions(
                parsedLocations.map((item) => {
                    const [name, code] = item.split(":");
                    return { name, code };
                })
            );

            const parsedPanss = JSON.parse(source.pass_names);
            setPanssOptions(
                parsedPanss.map((item) => {
                    const [name, code] = item.split(":");
                    return { name, code };
                })
            );

            const parsedUppAisTpCd = JSON.parse(source.uppaistpcd_names);
            setUppAisTpCdOptions(
                parsedUppAisTpCd.map((item) => {
                    const [name, code] = item.split(":");
                    return { name, code };
                })
            );
        };

        fetchAndActivate(remoteConfig)
            .then(() => {
                applyOptions({
                    location_names: getValue(remoteConfig, "location_names").asString(),
                    pass_names: getValue(remoteConfig, "pass_names").asString(),
                    uppaistpcd_names: getValue(remoteConfig, "uppaistpcd_names").asString()
                });
            })
            .catch((err) => {
                console.error("Remote Config 로드 실패, 기본값(defaultConfig) 사용됨:", err);
                try {
                    applyOptions(REMOTE_CONFIG_DEFAULTS);
                } catch (fallbackErr) {
                    console.error("기본값 파싱도 실패:", fallbackErr);
                }
            })
            .finally(() => {
                setRemoteConfigLoading(false);
            });
    }, []);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    PAGE: page,
                    CNP_CD: region || undefined, 
                    PAN_SS: panss || undefined,
                    PAN_ST_DT: startDate ? startDate.replace(/-\.\" "/g, "") : undefined,
                    PAN_ED_DT: endDate ? endDate.replace(/-\.\" "/g, "") : undefined,
                    UPP_AIS_TP_CD: uppAisTpCd || undefined
                };

                const json = await fetchLeaseNotices(params);

                if (isMounted) {
                    setNotices(json);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    setNotices([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [region, panss, startDate, endDate, page, uppAisTpCd]);

    // 모달 열림 시 배경 스크롤 차단
    useEffect(() => {
        if (selectedNotice) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedNotice]);

    // 선택된 공고의 상세 정보를 fetchLeaseNoticeDetail로 조회
    useEffect(() => {
        if (!selectedNotice) {
            setDetail(null);
            setDetailError(null);
            return;
        }

        let isMounted = true;
        setDetailLoading(true);
        setDetailError(null);
        setDetail(null);

        fetchLeaseNoticeDetail({
            PAN_ID: selectedNotice.PAN_ID,
            UPP_AIS_TP_CD: selectedNotice.UPP_AIS_TP_CD || uppAisTpCd,
            AIS_TP_CD: selectedNotice.AIS_TP_CD,
            SPL_INF_TP_CD: selectedNotice.SPL_INF_TP_CD,
            CCR_CNNT_SYS_DS_CD: selectedNotice.CCR_CNNT_SYS_DS_CD
        })
            .then((json) => {
                // 응답 형태: [{ dsSch: [...] }, { dsCtrtPlc, dsSplScdl01, dsSplScdl02, dsAhflInfo, dsEtcInfo, ... }]
                const data = Array.isArray(json) ? json[1] : json;
                if (isMounted) setDetail(data || null);
            })
            .catch((err) => {
                if (isMounted) setDetailError(err.message);
            })
            .finally(() => {
                if (isMounted) setDetailLoading(false);
            });

        return () => { isMounted = false; };
    }, [selectedNotice]);

    // dsSplScdl01(입찰형) / dsSplScdl02(추첨형) 중 데이터가 있는 쪽을 선택
    const getActiveSchedule = (d) => {
        if (!d) return null;
        if (d.dsSplScdl02 && d.dsSplScdl02.length > 0) {
            return {
                title: "추첨일정",
                data: d.dsSplScdl02[0],
                labels: (d.dsSplScdl02Nm && d.dsSplScdl02Nm[0]) || {}
            };
        }
        if (d.dsSplScdl01 && d.dsSplScdl01.length > 0) {
            return {
                title: "입찰일정",
                data: d.dsSplScdl01[0],
                labels: (d.dsSplScdl01Nm && d.dsSplScdl01Nm[0]) || {}
            };
        }
        return null;
    };

    const schedule = getActiveSchedule(detail);

    return (
        <div className="webview-container">
            <div className="fixed-header-box">
                <h1 className="webview-title">LH분양 공고</h1>

                <div className="filter-wrapper">
                    <div className="filter-row">
                        <select
                            className="filter-select"
                            value={region}
                            onChange={(e) => {
                                setRegion(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">지역</option>
                            {remoteConfigLoading ? (
                                <option value="" disabled>불러오는 중...</option>
                            ) : locationOptions.length === 0 ? (
                                <option value="" disabled>옵션 없음</option>
                            ) : (
                                locationOptions.map(({ name, code }) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))
                            )}
                        </select>

                        <select
                            className="filter-select"
                            value={panss}
                            onChange={(e) => {
                                setPanss(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">공고상태</option>
                            {remoteConfigLoading ? (
                                <option value="" disabled>불러오는 중...</option>
                            ) : panssOptions.length === 0 ? (
                                <option value="" disabled>옵션 없음</option>
                            ) : (
                                panssOptions.map(({ name, code }) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))
                            )}
                        </select>

                        <select
                            className="filter-select"
                            value={uppAisTpCd}
                            onChange={(e) => {
                                setUppAisTpCd(e.target.value);
                                setPage(1);
                            }}
                        >
                            {remoteConfigLoading ? (
                                <option value="" disabled>불러오는 중...</option>
                            ) : uppAisTpCdOptions.length === 0 ? (
                                <option value="" disabled>옵션 없음</option>
                            ) : (
                                uppAisTpCdOptions.map(({ name, code }) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="date-filter-row">
                        <div className="date-field">
                            <span className="date-field-label">게시 시작일</span>
                            <input
                                type="date"
                                className="filter-date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <span className="date-separator">~</span>

                        <div className="date-field">
                            <span className="date-field-label">게시 종료일</span>
                            <input
                                type="date"
                                className="filter-date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content-area">
                {loading ? (
                    <div className="webview-center-message">
                        <div className="spinner"></div>
                        <p>조건에 맞는 공고를 검색 중입니다...</p>
                    </div>
                ) : error ? (
                    <div className="webview-center-message">
                        <p className="error-text">⚠️ 에러가 발생했습니다.<br />{error}</p>
                    </div>
                ) : notices.length === 0 ? (
                    <div className="webview-center-message">
                        <p>조건에 부합하는 공고가 없습니다.</p>
                    </div>
                ) : (
                    <div className="card-list">
                        {notices.map((item) => (
                            <button
                                key={item.PAN_ID}
                                type="button"
                                className="notice-card"
                                onClick={() => {
                                    let detailUrl = item.DTL_URL;

                                    // 💡 LH 웹페이지 특성상 모바일 컨텍스트(&mi=1027 등) 환경임을 주소에 명시해주면
                                    // 시스템이 모바일 레이아웃(id="mNav"가 포함된 구조)을 훨씬 안정적으로 내려줍니다.
                                    if (detailUrl && !detailUrl.includes("mi=")) {
                                        const separator = detailUrl.includes("?") ? "&" : "?";
                                        detailUrl = `${detailUrl}${separator}mi=1027`;
                                    }

                                    // 네이티브로 안전하게 Push 뷰 오픈 요청
                                    openNativeWebView(detailUrl, {
                                        title: uppAisTpCdToName(item.UPP_AIS_TP_CD) || "공고 상세",
                                        PAN_ID: item.PAN_ID,
                                        CNP_CD_NM: item.CNP_CD_NM,
                                        DTL_URL: detailUrl,
                                        PAN_SS: item.PAN_SS,
                                        PAN_NM: item.PAN_NM,
                                        AIS_TP_CD_NM: item.AIS_TP_CD_NM,
                                        UPP_AIS_TP_CD: item.UPP_AIS_TP_CD,
                                        PAN_NT_ST_DT: item.PAN_NT_ST_DT,
                                        CLSG_DT: item.CLSG_DT
                                    });
                                }}
                            >
                                <div className="badge-container">
                                    <span className="badge badge-status">{item.PAN_SS}</span>
                                    <span className="badge badge-region">{item.CNP_CD_NM}</span>
                                </div>

                                <h2 className="notice-title">{item.PAN_NM}</h2>

                                <div className="notice-dates">
                                    <div className="date-item">
                                        공고일: <span>{item.PAN_NT_ST_DT}</span>
                                    </div>
                                    <div className="date-item">
                                        마감일: <span className="deadline">{item.CLSG_DT}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="floating-bottom-bar">
                <button
                    className="page-button"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1 || loading}
                >
                    이전
                </button>
                <span className="page-indicator">페이지 {page}</span>
                <button
                    className="page-button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={loading || notices.length < 30}
                >
                    다음
                </button>
            </div>

            {selectedNotice && (
                <div className="notice-modal-overlay">
                    <div className="notice-modal">
                        <div className="notice-modal-header">
                            <button
                                type="button"
                                className="notice-modal-close"
                                onClick={() => setSelectedNotice(null)}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="notice-modal-body">
                            <div className="badge-container">
                                <span className="badge badge-status">{selectedNotice.PAN_SS}</span>
                                <span className="badge badge-region">{selectedNotice.CNP_CD_NM}</span>
                            </div>

                            <h2 className="notice-modal-title">{selectedNotice.PAN_NM}</h2>

                            <div className="notice-modal-dates">
                                <div className="date-item">
                                    공고일: <span>{selectedNotice.PAN_NT_ST_DT}</span>
                                </div>
                                <div className="date-item">
                                    마감일: <span className="deadline">{selectedNotice.CLSG_DT}</span>
                                </div>
                            </div>

                            {detailLoading ? (
                                <div className="webview-center-message">
                                    <div className="spinner"></div>
                                    <p>상세 내용을 불러오는 중입니다...</p>
                                </div>
                            ) : detailError ? (
                                <div className="webview-center-message">
                                    <p className="error-text">⚠️ {detailError}</p>
                                </div>
                            ) : detail ? (
                                <div className="notice-detail-content">
                                    {detail.dsEtcInfo && detail.dsEtcInfo[0] && detail.dsEtcInfo[0].PAN_DTL_CTS && (
                                        <section className="detail-section">
                                            <h3 className="detail-section-title">
                                                {(detail.dsEtcInfoNm && detail.dsEtcInfoNm[0] && detail.dsEtcInfoNm[0].PAN_DTL_CTS) || "공고내용"}
                                            </h3>
                                            <p className="detail-text">{detail.dsEtcInfo[0].PAN_DTL_CTS}</p>
                                        </section>
                                    )}

                                    {detail.dsCtrtPlc && detail.dsCtrtPlc[0] && (
                                        <section className="detail-section">
                                            <h3 className="detail-section-title">계약장소</h3>
                                            <p className="detail-text">
                                                {detail.dsCtrtPlc[0].CTRT_PLC_ADR} {detail.dsCtrtPlc[0].CTRT_PLC_DTL_ADR}
                                            </p>
                                        </section>
                                    )}

                                    {schedule && (
                                        <section className="detail-section">
                                            <h3 className="detail-section-title">{schedule.title}</h3>
                                            <div className="detail-table-wrapper">
                                                <table className="detail-table">
                                                    <tbody>
                                                        {Object.keys(schedule.data).map((key) => (
                                                            <tr key={key}>
                                                                <th>{schedule.labels[key] || key}</th>
                                                                <td>{schedule.data[key]}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    )}

                                    {detail.dsAhflInfo && detail.dsAhflInfo.length > 0 && (
                                        <section className="detail-section">
                                            <h3 className="detail-section-title">첨부파일</h3>
                                            <div className="detail-table-wrapper">
                                                <table className="detail-table">
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                {(detail.dsAhflInfoNm && detail.dsAhflInfoNm[0] && detail.dsAhflInfoNm[0].SL_PAN_AHFL_DS_CD_NM) || "파일구분"}
                                                            </th>
                                                            <th>
                                                                {(detail.dsAhflInfoNm && detail.dsAhflInfoNm[0] && detail.dsAhflInfoNm[0].CMN_AHFL_NM) || "파일명"}
                                                            </th>
                                                            <th>
                                                                {(detail.dsAhflInfoNm && detail.dsAhflInfoNm[0] && detail.dsAhflInfoNm[0].AHFL_URL) || "다운로드"}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detail.dsAhflInfo.map((file, idx) => (
                                                            <tr key={idx}>
                                                                <td>{file.SL_PAN_AHFL_DS_CD_NM}</td>
                                                                <td>{file.CMN_AHFL_NM}</td>
                                                                <td>
                                                                    <a href={file.AHFL_URL} target="_blank" rel="noopener noreferrer">
                                                                        다운로드
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LeaseNoticeList;