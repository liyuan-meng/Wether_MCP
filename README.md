# Weather MCP Server

一个基于 Model Context Protocol (MCP) 的天气服务器，提供美国国家气象局 (National Weather Service) 的天气数据访问功能。

## 🌟 功能特性

- **天气警报查询** - 获取美国各州的实时天气警报
- **天气预报查询** - 根据经纬度获取详细的天气预报
- **MCP 协议支持** - 完全兼容 Model Context Protocol 标准
- **TypeScript 编写** - 类型安全，易于维护
- **零配置** - 无需 API 密钥，直接使用 NWS 公共 API

## 📦 安装

### 前置要求

- Node.js 16.0.0 或更高版本
- npm 或 yarn 包管理器

### 克隆项目

```bash
git clone <repository-url>
cd Wether_MCP
```

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
npm run build
```

## 🚀 使用方法

### 在 Cursor 中配置

1. 打开 Cursor 的 MCP 配置文件 `~/.cursor/mcp.json`
2. 添加以下配置：

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": [
        "/ABSOLUTE_PATH/Wether_MCP/build/index.js"
      ]
    }
  }
}
```

> 注意：请将 `/path/to/your/Wether_MCP` 替换为您的实际项目路径（绝对路径）

3. 重启 Cursor 应用程序

### 可用工具

#### 1. get-alerts - 获取天气警报

获取指定州的天气警报信息。

**参数：**
- `state` (string): 两个字母的州代码（如 CA、NY、TX）

**示例：**
```
get-alerts CA  # 获取加利福尼亚州的天气警报
get-alerts NY  # 获取纽约州的天气警报
```

#### 2. get-forecast - 获取天气预报

根据经纬度获取详细的天气预报。

**参数：**
- `latitude` (number): 纬度 (-90 到 90)
- `longitude` (number): 经度 (-180 到 180)

**示例：**
```
get-forecast 37.7749 -122.4194  # 获取旧金山的天气预报
get-forecast 40.7128 -74.0060   # 获取纽约市的天气预报
```

## 🗺️ 美国州代码参考

| 州代码 | 州名 | 州代码 | 州名 |
|--------|------|--------|------|
| AL | Alabama | MT | Montana |
| AK | Alaska | NE | Nebraska |
| AZ | Arizona | NV | Nevada |
| AR | Arkansas | NH | New Hampshire |
| CA | California | NJ | New Jersey |
| CO | Colorado | NM | New Mexico |
| CT | Connecticut | NY | New York |
| DE | Delaware | NC | North Carolina |
| FL | Florida | ND | North Dakota |
| GA | Georgia | OH | Ohio |
| HI | Hawaii | OK | Oklahoma |
| ID | Idaho | OR | Oregon |
| IL | Illinois | PA | Pennsylvania |
| IN | Indiana | RI | Rhode Island |
| IA | Iowa | SC | South Carolina |
| KS | Kansas | SD | South Dakota |
| KY | Kentucky | TN | Tennessee |
| LA | Louisiana | TX | Texas |
| ME | Maine | UT | Utah |
| MD | Maryland | VT | Vermont |
| MA | Massachusetts | VA | Virginia |
| MI | Michigan | WA | Washington |
| MN | Minnesota | WV | West Virginia |
| MS | Mississippi | WI | Wisconsin |
| MO | Missouri | WY | Wyoming |

## 📚 API 说明

### 数据来源

本项目使用美国国家气象局 (National Weather Service) 的公共 API：
- 基础 URL: `https://api.weather.gov`
- 无需 API 密钥
- 仅支持美国境内的天气数据

### 天气警报返回格式

```json
{
  "Event": "警报类型",
  "Area": "影响地区",
  "Severity": "严重程度",
  "Status": "状态",
  "Headline": "详细标题"
}
```

### 天气预报返回格式

```json
{
  "name": "时间段名称",
  "temperature": "温度",
  "temperatureUnit": "温度单位",
  "windSpeed": "风速",
  "windDirection": "风向",
  "shortForecast": "天气概况"
}
```

## 🔍 查看日志

### 三种查看日志的方法

**方法一：查看日志文件（推荐）**
Weather MCP 会自动创建日志文件，记录所有活动：

```bash
# 查看实时日志
tail -f weather-mcp.log

# 查看完整日志
cat weather-mcp.log

# 清空日志文件
rm weather-mcp.log
```

**方法二：通过 Cursor 开发者工具**
1. 在 Cursor 中按 `Cmd/Ctrl + Shift + P` 打开命令面板
2. 输入 "Developer: Toggle Developer Tools"
3. 在开发者工具中查看 Console 标签
4. 所有 MCP 日志都会显示在这里

### 日志输出说明

**启动日志:**
- `Weather MCP Server running on stdio` - 服务器启动成功

**天气警报日志:**
- `[Weather MCP] 接收到获取天气警报请求 - 州代码: XX` - 收到请求
- `[Weather MCP] 请求 URL: xxx` - 显示 API 请求地址
- `[Weather MCP] 获取到 N 条 XX 州警报` - 成功获取数据
- `[Weather MCP] 获取 XX 州警报数据失败` - 请求失败

**天气预报日志:**
- `[Weather MCP] 接收到获取天气预报请求 - 坐标: xx, xx` - 收到请求
- `[Weather MCP] 请求网格点 URL: xxx` - 网格点 API 请求
- `[Weather MCP] 请求预报 URL: xxx` - 预报 API 请求
- `[Weather MCP] 获取到 N 个预报时段` - 成功获取数据
- `[Weather MCP] 成功返回天气预报数据` - 完成响应

**错误日志:**
- `Error making NWS request: xxx` - API 请求错误
- `Fatal error in main(): xxx` - 严重错误

### 调试技巧

1. **检查配置**
   ```bash
   # 确认 MCP 配置路径是否正确
   cat ~/.cursor/mcp.json
   ```

2. **测试连接**
   ```bash
   # 独立运行 MCP 服务器
   node build/index.js
   # 如果看到 "Weather MCP Server running on stdio" 说明启动成功
   ```

3. **调试日志输出**
   ```bash
   # 启用详细日志（同时输出到 stdout 和 stderr）
   MCP_DEBUG=true node build/index.js
   
   # 如果希望只看到主要日志（推荐）
   node build/index.js 2>&1 | grep "Weather MCP"
   ```

4. **查看网络请求**
   - 如果看到 "Error making NWS request" 可能是网络问题
   - 检查是否能访问 `https://api.weather.gov`

### 日志配置说明

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `MCP_DEBUG` | `false` | 设为 `true` 时同时输出到 stdout 和 stderr |

**为什么区分 stdout 和 stderr？**
- MCP 协议要求 stdout 用于协议通信
- 日志应该使用 stderr 避免干扰协议
- 在 Cursor 中，两种输出都会在开发者工具中显示

## 🔧 开发

### 项目结构

```
Wether_MCP/
├── src/
│   ├── index.ts      # 主服务器文件
│   ├── helper.ts     # 工具函数
│   └── constant.ts   # 常量定义
├── build/            # 构建输出目录
├── package.json      # 项目配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 项目文档
```

### 本地开发

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 运行服务器（用于测试）
node build/index.js
```

### 添加新功能

1. 在 `src/` 目录中修改相关文件
2. 运行构建命令：`npm run build`
3. 重启 Cursor 以应用更改

## 📋 常见问题

### Q: 为什么只支持美国的天气数据？
A: 本项目使用美国国家气象局的 API，该 API 仅提供美国境内的天气数据。

### Q: 如何获取其他国家的天气数据？
A: 需要集成其他天气服务提供商的 API，如 OpenWeatherMap、WeatherAPI 等。

### Q: 天气预报需要经纬度坐标，如何获取？
A: 可以使用地理编码服务，或者在线地图工具获取具体位置的经纬度。

### Q: 配置后在 Cursor 中看不到工具？
A: 请检查：
1. 构建路径是否正确
2. 是否重启了 Cursor
3. 配置文件格式是否正确

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送到分支：`git push origin feature/新功能`
5. 提交 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [Model Context Protocol](https://github.com/modelcontextprotocol/mcp)
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
- [Cursor 编辑器](https://cursor.sh/)

---

**注意：** 使用本工具获取的天气信息仅供参考，请以官方气象部门发布的信息为准。 