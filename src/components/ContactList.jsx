import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

function ContactList() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setContacts(list);
            setLoading(false);
        }, (error) => {
            console.error("목록 조회 실패:", error);
            setLoading(false)
        });

        // 컴포넌트 unmount 시 리스너 해제
        return () => unsubscribe();
    }, []);

    if (loading) return <p>불러오는 중...</p>;
    if (contacts.length === 0) return <p>등록된 연락처가 없습니다.</p>;

    return(
        <table border="1" cellPadding="8">
            <thread>
                <tr>
                    <th>이름</th>
                    <th>전화번호</th>
                    <th>등록일시</th>
                </tr>
            </thread>
            <tbody>
                {contacts.map((contact) => (
                    <tr key={contact.id}>
                        <td>{contact.name}</td>
                        <td>{contact.phone}</td>
                        <td>
                            {contact.createdAt ? contact.createdAt.toDate().toLocaleString("ko-KR") : "-"}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default ContactList;