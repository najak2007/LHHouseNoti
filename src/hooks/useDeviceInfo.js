import { useEffect, useState } from "react"

export function useDeviceInfo() {
    const [deviceInfo, setDeviceInfo] = useState({uuid: null, token: null, ostype: null});

    useEffect(() => {
        window.receiveDeviceInfo = (uuid, token, ostype) => {
            console.log("기기 정보 수신:", uuid, token, ostype);
            setDeviceInfo({ uuid, token, ostype });
        };

        if(window.webkit?.messageHandlers?.nativeBridge) {
            window.webkit.messageHandlers.nativeBridge.postMessage("deviceInfoReq");
        }

        return () => {
            delete window.receiveDeviceInfo;
        };
    }, []);

    return deviceInfo;
}