import { useState} from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function ContactForm() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!name.trim() || !phone.trim()) {
            setStatus("이름과 전화번호를 모두 입력해주세요.");
            return
        }

        try {
            setStatus("저장 중...");

            await addDoc(collection(db, "contacts"), {
                name: name.trim(),
                phone: phone.trim(),
                createdAt: serverTimestamp()
            });

            setStatus("저장 완료!");
            setName("");
            setPhone("");
        } catch (error) {
            console.error("저장 실패: ", error);
            setStatus("저장 실패: " + error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">이름</label>
                <input 
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍블루"
                />
            </div>

            <div>
                <label htmlFor="phone">전화번호</label>
                <input 
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder ="010-____-____"
                />
            </div>

            <button type="submit">저장</button>

            {status && <p>{status}</p>}

        </form>
    );
}

export default ContactForm;