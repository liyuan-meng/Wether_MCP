# 🔧 MCP 天气服务器调试指南

## 📋 目录
1. [基础调试方法](#基础调试方法)
2. [日志调试](#日志调试)
3. [脚本调试](#脚本调试)
4. [性能调试](#性能调试)
5. [错误排查](#错误排查)
6. [调试工具](#调试工具)

## 🛠️ 基础调试方法

### 方法1：直接运行服务器
```bash
# 启动服务器
node build/index.js

# 服务器会输出启动信息，然后等待stdin输入
# 按 Ctrl+C 退出
```

### 方法2：手动发送MCP消息
```bash
# 在另一个终端窗口中，向运行中的服务器发送消息
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node build/index.js
```

## 📝 日志调试

### 1. 启用调试日志
```bash
# 设置环境变量启用详细日志
export MCP_DEBUG=true
node build/index.js
```

### 2. 监控日志文件
```bash
# 实时查看日志
tail -f weather-mcp.log

# 查看最近的日志
tail -20 weather-mcp.log

# 搜索特定内容
grep "get-alerts" weather-mcp.log
```

### 3. 日志级别说明
- `启动日志`: 服务器启动时的基本信息
- `请求日志`: 每次API调用的详细信息
- `错误日志`: 异常和错误情况
- `调试日志`: 详细的执行过程（需要MCP_DEBUG=true）

## 🎯 脚本调试

### 简单调试脚本
```bash
# 测试单个州
node simple-debug.js DE

# 测试多个州
node simple-debug.js CA TX NY
```

### 高级调试脚本
```bash
# 基础测试
node debug-advanced.js DE

# 详细输出
node debug-advanced.js DE --verbose

# 性能测试
node debug-advanced.js DE --performance

# 错误测试
node debug-advanced.js DE --error-test

# 保存结果
node debug-advanced.js DE --save

# 组合选项
node debug-advanced.js CA CO TX --verbose --performance --save
```

### 调试脚本参数说明
| 参数 | 说明 |
|------|------|
| `--verbose` | 显示详细的调试信息 |
| `--performance` | 进行性能测试（3次调用取平均值） |
| `--error-test` | 测试错误处理 |
| `--save` | 将结果保存到JSON文件 |

## ⚡ 性能调试

### 1. 响应时间分析
```javascript
// 在调试脚本中添加时间测量
const startTime = Date.now();
// ... 调用API
const endTime = Date.now();
console.log(`响应时间: ${endTime - startTime}ms`);
```

### 2. 内存使用监控
```javascript
// 监控内存使用
const memBefore = process.memoryUsage();
// ... 执行操作
const memAfter = process.memoryUsage();
console.log('内存变化:', {
  rss: memAfter.rss - memBefore.rss,
  heapUsed: memAfter.heapUsed - memBefore.heapUsed
});
```

### 3. 并发测试
```bash
# 使用高级调试脚本进行性能测试
node debug-advanced.js DE --performance

# 多州并发测试
node debug-advanced.js CA TX NY FL CO --performance
```

## 🚨 错误排查

### 常见错误类型

#### 1. 连接错误
```
错误: ECONNREFUSED
解决: 检查网络连接，确保可以访问api.weather.gov
```

#### 2. 无效州代码
```
错误: 400 Bad Request
解决: 确保州代码为2位字母，如 "CA", "TX"
```

#### 3. MCP协议错误
```
错误: Invalid JSON-RPC
解决: 检查消息格式是否正确
```

#### 4. 超时错误
```
错误: Request timeout
解决: 增加超时时间或检查网络状况
```

### 调试步骤

1. **检查服务器启动**
   ```bash
   node build/index.js
   # 应该看到: "Weather MCP Server running on stdio"
   ```

2. **验证日志系统**
   ```bash
   cat weather-mcp.log
   # 应该看到启动日志
   ```

3. **测试单个调用**
   ```bash
   node simple-debug.js DE
   # 检查是否正常返回结果
   ```

4. **检查详细日志**
   ```bash
   tail -f weather-mcp.log
   # 在另一个终端执行调试脚本，观察日志输出
   ```

## 🔧 调试工具

### 1. 内置调试命令
```bash
# 构建项目
npm run build

# 运行服务器
npm start

# 查看日志
npm run logs  # 如果在package.json中配置了此命令
```

### 2. 外部工具

#### JSON格式化工具
```bash
# 格式化JSON输出
node simple-debug.js DE | jq '.'

# 提取特定字段
node debug-advanced.js DE --save
cat debug-results-*.json | jq '.[] | {state, alertCount, callTime}'
```

#### 网络调试
```bash
# 直接测试NWS API
curl "https://api.weather.gov/alerts?area=DE"

# 测试网络延迟
ping api.weather.gov
```

### 3. 调试模式环境变量

```bash
# 启用详细日志
export MCP_DEBUG=true

# 设置日志级别
export LOG_LEVEL=debug

# 设置超时时间
export API_TIMEOUT=10000
```

## 📊 调试结果分析

### 日志分析
```bash
# 统计调用次数
grep "接收到获取天气警报请求" weather-mcp.log | wc -l

# 分析响应时间
grep "成功返回.*州警报数据" weather-mcp.log

# 查看错误
grep "ERROR\|错误" weather-mcp.log
```

### 性能分析
```bash
# 运行性能测试
node debug-advanced.js CA TX NY --performance --save

# 分析结果
cat debug-results-*.json | jq '.[] | {state, callTime, alertCount}'
```

## 💡 调试最佳实践

1. **逐步调试**: 从简单到复杂，先确保基本功能正常
2. **日志记录**: 始终检查日志文件获取详细信息
3. **网络测试**: 在调试前确认网络连接正常
4. **环境隔离**: 使用不同的终端窗口分别运行服务器和调试脚本
5. **结果保存**: 使用 `--save` 选项保存调试结果供后续分析

## 🆘 获取帮助

如果遇到问题，请按以下顺序检查：

1. 检查日志文件: `cat weather-mcp.log`
2. 运行简单调试: `node simple-debug.js DE`
3. 检查网络连接: `curl "https://api.weather.gov/alerts?area=DE"`
4. 重新构建项目: `npm run build`
5. 查看详细调试信息: `node debug-advanced.js DE --verbose`

---

🔗 **相关文件**:
- `simple-debug.js` - 简单调试脚本
- `debug-advanced.js` - 高级调试脚本
- `weather-mcp.log` - 日志文件 