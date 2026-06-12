import { useEffect, useState } from "react";
import { fetchLeaseNotices } from "../services/lhApi";

function LeaseNoticeList() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const json = await fetchLeaseNotices({});

                console.log("응답 전체:", json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    
    if (loading) return <p>불러오는 중...</p>;
    if (error) return <p>에러: {error}</p>;
    if (notices.length === 0) return <p>공고가 없습니다.</p>;

    return (
        <table border="1" cellPadding="8">
            <thead>
                <tr>
                    <th>상태</th>
                    <th>지역</th>
                    <th>공고명</th>
                    <th>공고일</th>
                    <th>접수마감일</th>
                </tr>
            </thead>
            
            <tbody>
                {notices.map((item) => (
                    <tr key={item.PAN_ID}>
                        <td>{item.PAN_SS}</td>
                        <td>{item.CNP_CD_NM}</td>
                        <td>
                            <a href={item.DTL_URL} target="_blank" rel="noopener noreferrer">
                                {item.PAN_NM}
                            </a>
                        </td>
                        <td>{item.PAN_NT_ST_DT}</td>
                        <td>{item.CLSG_DT}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default LeaseNoticeList;