import { useEffect, useState } from "react";
import { fetchLeaseNotices, fetchNoticeDetail } from "../services/lhApi";
import "../css/LeaseNoticeList.css";

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

    const [region, setRegion] = useState("");
    const [panss, setPanss] = useState("");
    const [uppAisTpCd, setUppAisTpCd] = useState("05"); // ✨ 추가: 공고유형 필터
    const [startDate, setStartDate] = useState(formatDate(twoMonthsAgo));
    const [endDate, setEndDate] = useState(formatDate(today));

    // ✨ 선택된 공고 (모달 오픈 여부 겸용)
    const [selectedNotice, setSelectedNotice] = useState(null);

    // ✨ 상세 본문 HTML 및 로딩 상태
    const [detailHtml, setDetailHtml] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const params = {
                    PAGE: page,
                    locationName: region || undefined,
                    PAN_SS: panss || undefined,
                    PAN_ST_DT: startDate ? startDate.replace(/-/g, "") : undefined,
                    PAN_ED_DT: endDate ? endDate.replace(/-/g, "") : undefined,
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

    // ✨ 모달 열림/배경 스크롤 차단
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

    // ✨ 선택된 공고의 상세 본문 fetch
    const [detail, setDetail] = useState(null); // { noticeContent, tables }

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

        fetchNoticeDetail(selectedNotice.DTL_URL)
            .then((data) => {
                if (isMounted) setDetail(data);
            })
            .catch((err) => {
                if (isMounted) setDetailError(err.message);
            })
            .finally(() => {
                if (isMounted) setDetailLoading(false);
            });

        return () => { isMounted = false; };
    }, [selectedNotice]);

    return (
        <div className="webview-container">
            <div className="fixed-header-box">
                <h1 className="webview-title">임대주택 공고</h1>

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
                            <option value="">지역 전체</option>
                            <option value="서울">서울</option>
                            <option value="경기">경기</option>
                            <option value="부산">부산</option>
                            <option value="인천">인천</option>
                            <option value="광주">광주</option>
                            <option value="대전">대전</option>
                            <option value="울산">울산</option>
                            <option value="세종">세종</option>
                            <option value="강원">강원</option>
                            <option value="충북">충북</option>
                            <option value="충남">충남</option>
                            <option value="전북">전북</option>
                            <option value="전남">전남</option>
                            <option value="경북">경북</option>
                            <option value="경남">경남</option>
                            <option value="제주">제주</option>
                        </select>

                        <select
                            className="filter-select"
                            value={panss}
                            onChange={(e) => {
                                setPanss(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">공고상태 전체</option>
                            <option value="공고중">공고중</option>
                            <option value="접수중">접수중</option>
                            <option value="접수마감">접수마감</option>
                            <option value="상담요청">상담요청</option>
                            <option value="정정공고중">정정공고중</option>
                        </select>

                        <select 
                            className="filter-select"
                            value={uppAisTpCd}
                            onChange={(e) => {
                                setUppAisTpCd(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="05">분양주택</option>
                            <option value="01">토지</option>
                            <option value="06">임대주택</option>
                            <option value="13">주거복지</option>
                            <option value="22">상가</option>
                            <option value="39">신혼희망타운</option>
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
                                onClick={() => setSelectedNotice(item)}
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

            {/* ✨ 풀스크린 상세 팝업 */}
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
                                    <a href={selectedNotice.DTL_URL} target="_blank" rel="noopener noreferrer">
                                        새 창에서 보기
                                    </a>
                                </div>
                            ) : detail ? (
                                <div className="notice-detail-content">
                                    {detail.noticeContent && (
                                        <section className="detail-section">
                                            <h3 className="detail-section-title">공고내용</h3>
                                            <p className="detail-text">{detail.noticeContent}</p>
                                        </section>
                                    )}

                                    {detail.tables.map((table, idx) => (
                                        <section className="detail-section" key={idx}>
                                            <div className="detail-table-wrapper">
                                                <table className="detail-table">
                                                    {table.headers.length > 0 && (
                                                        <thead>
                                                            <tr>
                                                                {table.headers.map((h, i) => <th key={i}>{h}</th>)}
                                                            </tr>
                                                        </thead>
                                                    )}
                                                    <tbody>
                                                        {table.rows.map((row, rIdx) => (
                                                            <tr key={rIdx}>
                                                                {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>
                                    ))}
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