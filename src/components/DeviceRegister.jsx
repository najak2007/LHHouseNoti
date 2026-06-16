import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useDeviceInfo } from "../hooks/useDeviceInfo";

function DeviceRegister() {
    const { uuid, token, ostype } = useDeviceInfo();
    const [status, setStatus] = useState("");
    const [ osname, setOsname] = useState("")

    useEffect(() => {
        if (!uuid) return;

        const registerDevice = async () => {
            try {
                setStatus("기기 정보 저장 중...");

                await setDoc(doc(db, "devices", uuid), {
                    uuid: uuid,
                    pushToken: token,
                    platform: ostype,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                setStatus("기기 등록 완료");
                setOsname(ostype === "i" ? "iOS" : "Android");
            } catch (error) {
                console.error("기기 등록 실패:", error);
                setStatus("기기 등록 실패: " + error.message);
            }
        };

        registerDevice();
    }, [uuid, token, ostype]);
}

export default DeviceRegister;