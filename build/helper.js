// Helper function 用于发送 NWS API 请求
import { USER_AGENT } from "./constant.js";
/**
 * 发送 NWS API 请求
 * @param url 请求 URL
 * @returns 请求结果
 */
async function makeNWSRequest(url) {
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/geo+json",
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
/**
 * 格式化警报数据
 * @param feature 警报数据
 * @returns 格式化后的字符串
 */
function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
export { makeNWSRequest, formatAlert };
