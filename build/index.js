import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { makeNWSRequest, formatAlert } from "./helper.js";
import { NWS_API_BASE } from "./constant.js";
import * as fs from "fs";
import * as path from "path";
// 获取项目根目录（通过多种方式）
const getProjectRoot = () => {
    // 尝试多种方式获取项目根目录
    const possiblePaths = [
        process.cwd(),
        path.dirname(process.argv[1]),
        path.dirname(new URL(import.meta.url).pathname),
        '/Users/liyuanmeng/Workspace/Github/Wether_MCP'
    ];
    for (const projectPath of possiblePaths) {
        try {
            if (fs.existsSync(path.join(projectPath, 'package.json'))) {
                return projectPath;
            }
        }
        catch (error) {
            // 忽略错误，继续尝试下一个路径
        }
    }
    // 如果都找不到，使用当前工作目录
    return process.cwd();
};
// 日志配置
const LOG_CONFIG = {
    // 在 MCP 模式下使用 stderr，独立运行时可以使用 stdout
    USE_CONSOLE_LOG: process.env.MCP_DEBUG === 'true',
    USE_CONSOLE_ERROR: true,
    USE_FILE_LOG: true,
    LOG_FILE: path.join(getProjectRoot(), 'weather-mcp.log')
};
// 统一的日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    // 控制台输出
    if (LOG_CONFIG.USE_CONSOLE_LOG) {
        console.log(logMessage);
    }
    if (LOG_CONFIG.USE_CONSOLE_ERROR) {
        console.error(logMessage);
    }
    // 文件输出
    if (LOG_CONFIG.USE_FILE_LOG) {
        try {
            fs.appendFileSync(LOG_CONFIG.LOG_FILE, logMessage + '\n');
        }
        catch (error) {
            // 文件写入失败时不影响主要功能，但记录到 stderr
            console.error('日志写入文件失败:', error);
            console.error('当前工作目录:', process.cwd());
            console.error('日志文件路径:', LOG_CONFIG.LOG_FILE);
        }
    }
}
const server = new McpServer({
    name: "weather",
    version: "1.0.0",
    description: "A simple weather app that uses the National Weather Service API",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// 注册天气 tools
server.tool("get-alerts", "获取某个州的天气警报", {
    state: z.string().length(2).describe("两个字母的州代码（例如 CA、NY）"),
}, async ({ state }) => {
    const stateCode = state.toUpperCase();
    log(`[Weather MCP] 接收到获取天气警报请求 - 州代码: ${stateCode}`);
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    log(`[Weather MCP] 请求 URL: ${alertsUrl}`);
    const alertsData = await makeNWSRequest(alertsUrl);
    if (!alertsData) {
        log(`[Weather MCP] 获取 ${stateCode} 州警报数据失败`);
        return {
            content: [
                {
                    type: "text",
                    text: "未能检索警报数据",
                },
            ],
        };
    }
    const features = alertsData.features || [];
    log(`[Weather MCP] 获取到 ${features.length} 条 ${stateCode} 州警报`);
    if (features.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `No active alerts for ${stateCode}`,
                },
            ],
        };
    }
    const formattedAlerts = features.map(formatAlert);
    const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;
    log(`[Weather MCP] 成功返回 ${stateCode} 州警报数据`);
    return {
        content: [
            {
                type: "text",
                text: alertsText,
            },
        ],
    };
});
server.tool("get-forecast", "获取某个位置的天气预报", {
    latitude: z.number().min(-90).max(90).describe("位置的纬度"),
    longitude: z.number().min(-180).max(180).describe("位置的经度"),
}, async ({ latitude, longitude }) => {
    // 获取网格点数据
    log(`[Weather MCP] 接收到获取天气预报请求 - 坐标: ${latitude}, ${longitude}`);
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    log(`[Weather MCP] 请求网格点 URL: ${pointsUrl}`);
    const pointsData = await makeNWSRequest(pointsUrl);
    if (!pointsData) {
        log(`[Weather MCP] 获取网格点数据失败 - 坐标: ${latitude}, ${longitude}`);
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
                },
            ],
        };
    }
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
        log(`[Weather MCP] 从网格点数据中获取预报 URL 失败`);
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to get forecast URL from grid point data",
                },
            ],
        };
    }
    // 获取预报数据
    log(`[Weather MCP] 请求预报 URL: ${forecastUrl}`);
    const forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        log(`[Weather MCP] 获取预报数据失败`);
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to retrieve forecast data",
                },
            ],
        };
    }
    const periods = forecastData.properties?.periods || [];
    log(`[Weather MCP] 获取到 ${periods.length} 个预报时段`);
    if (periods.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: "No forecast periods available",
                },
            ],
        };
    }
    // 格式化预报 periods
    const formattedForecast = periods.map((period) => [
        `${period.name || "Unknown"}:`,
        `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
        `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
        `${period.shortForecast || "No forecast available"}`,
        "---",
    ].join("\n"));
    const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;
    log(`[Weather MCP] 成功返回天气预报数据`);
    return {
        content: [
            {
                type: "text",
                text: forecastText,
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log(`Weather MCP Server running on stdio`);
    log(`当前工作目录: ${process.cwd()}`);
    log(`日志文件路径: ${LOG_CONFIG.LOG_FILE}`);
    log(`项目根目录: ${getProjectRoot()}`);
}
main().catch((error) => {
    log("Fatal error in main(): " + error);
    process.exit(1);
});
