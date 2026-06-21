export function openNativeWebView(url, options = {}) {
    const payload = {
        action: "openWebView",
        url,
        title: options.title || "",
        PAN_ID: options.PAN_ID || "",
        CNP_CD_NM: options.CNP_CD_NM || "",
        DTL_URL: options.DTL_URL || "",
        PAN_SS: options.PAN_SS || "",
        PAN_NM: options.PAN_NM || "",
        AIS_TP_CD_NM: options.AIS_TP_CD_NM || "",
        UPP_AIS_TP_CD: options.UPP_AIS_TP_CD || "",
        PAN_NT_ST_DT: options.PAN_NT_ST_DT || "",
        CLSG_DT: options.CLSG_DT || "",
    };

    if(
        window.webkit &&
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.nativeBridge
    ) {
        window.webkit.messageHandlers.nativeBridge.postMessage(payload);
        return true;
    } 

    if(window.AndroidBridge && typeof window.AndroidBridge.openWebView === "function") {
        window.AndroidBridge.openWebView(JSON.stringify(payload));
        return true;
    }

    console.warn("Native bridge is not available.");
    window.open(url, "_blank", "noopener,noreferrer");
    return false;
}