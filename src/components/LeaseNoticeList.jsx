import { useEffect, useState } from "react";
import { fetchLeaseNotices } from "../services/lhApi";
import "../css/LeaseNoticeList.css";

function LeaseNoticeList() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 💡 사용자가 선택할 필터 상태값 정의
    const [region, setRegion] = useState("");      // 지역 (CNP_CD)
    const [status, setStatus] = useState("");      // 공고상태 (PAN_SS)
    const [startDate, setStartDate] = useState("");// 시작일 (PAN_ST_DT)
    const [endDate, setEndDate] = useState("");    // 종료일 (PAN_ED_DT)

    useEffect(() => {
        let isMounted = true;
        
        const load = async () => {
            setLoading(true);
            try {
                // API 스펙에 맞춰 전달할 파라미터 구성
                const params = {
                    CNP_CD: region || undefined,
                    PAN_SS: status || undefined,
                    PAN_ST_DT: startDate ? startDate.replace(/-/g, "") : undefined, // YYYYMMDD 변환 필요시
                    PAN_ED_DT: endDate ? endDate.replace(/-/g, "") : undefined,
                };

                const json = await fetchLeaseNotices(params);
                if (isMounted) setNotices(json);
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();
        return () => { isMounted = false; };
    }, [region, status, startDate, endDate]); // 💡 필터 조건이 바뀔 때마다 자동으로 API를 재호출합니다.

    return (
        <div className="webview-container">
            
            {/* 📱 스크롤해도 화면 상단에 딱 고정되는 필터 영역 */}
            <div className="fixed-header-box">
                <h1 className="webview-title">임대주택 공고</h1>
                
                <div className="filter-wrapper">
                    {/* 첫 번째 줄: 지역 및 상태 선택 (Select) */}
                    <div className="filter-row">
                        <select 
                            className="filter-select" 
                            value={region} 
                            onChange={(e) => setRegion(e.target.value)}
                        >
                            <option value="">지역 전체</option>
                            <option value="11">서울</option>
                            <option value="41">경기</option>
                            <option value="26">부산</option>
                            <option value="28">인천</option>
                            {/* 필요한 LH 지역 코드(CNP_CD)에 맞춰 옵션을 추가하세요 */}
                        </select>

                        <select 
                            className="filter-select" 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">공고상태 전체</option>
                            <option value="접수중">접수중</option>
                            <option value="공고중">공고중</option>
                            <option value="접수마감">접수마감</option>
                        </select>
                    </div>

                    {/* 두 번째 줄: 날짜 범위 선택 (Date) */}
                    <div className="filter-row">
                        <input 
                            type="date" 
                            className="filter-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="date-separator">~</span>
                        <input 
                            type="date" 
                            className="filter-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 메인 콘텐츠 목록 (로딩/에러/결과물) */}
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
                        <a 
                            key={item.PAN_ID} 
                            href={item.DTL_URL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="notice-card"
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
                        </a>
                    ))}
                </div>
            )}

            {/* 하단 플로팅 바 & 새로고침 버튼 */}
            <div className="floating-bottom-bar">
                <button className="refresh-button" onClick={() => window.location.reload()}>
                    새로고침
                </button>
            </div>
        </div>
    );
}

export default LeaseNoticeList;