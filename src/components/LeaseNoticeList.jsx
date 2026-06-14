import { useEffect, useState } from "react";
import { fetchLeaseNotices } from "../services/lhApi";
import "../css/LeaseNoticeList.css";

function LeaseNoticeList() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const json = await fetchLeaseNotices({});
                setNotices(json);
                console.log("응답 전체:", json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    
// 1. 로딩 상태 UI
    if (loading) {
        return (
            <div className="webview-center-message">
                <div className="spinner"></div>
                <p>공고를 불러오는 중입니다...</p>
            </div>
        );
    }

// 2. 에러 상태 UI
    if (error) {
        return (
            <div className="webview-center-message">
                <p className="error-text">⚠️ 에러가 발생했습니다.<br />{error}</p>
            </div>
        );
    }

    if (notices.length === 0) {
        return (
            <div className="webview-center-message">
                <p>현재 진행 중인 공고가 없습니다.</p>
            </div>
        );
    }

 // 4. 정상 데이터 렌더링 UI
    return (
        <div className="webview-container">
            <h1 className="webview-title">임대주택 공고 목록</h1>

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