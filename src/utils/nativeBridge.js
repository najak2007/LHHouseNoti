export function openNativeWebView(url, options = {}) {
    const payload = {
        action: "openWebView",
        url,
        title: options.title || "",
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