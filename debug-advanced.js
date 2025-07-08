import { spawn } from 'child_process';
import fs from 'fs';

// 创建MCP消息
function createMCPMessage(id, method, params = {}) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method,
    params
  }) + '\n';
}

// 解析MCP响应
function parseMCPResponse(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// 统计警报类型
function analyzeAlerts(alertsText) {
  const lines = alertsText.split('\n');
  const eventLines = lines.filter(line => line.startsWith('Event:'));
  const severityLines = lines.filter(line => line.startsWith('Severity:'));
  
  const eventCounts = {};
  const severityCounts = {};
  
  eventLines.forEach(line => {
    const event = line.replace('Event: ', '').trim();
    eventCounts[event] = (eventCounts[event] || 0) + 1;
  });
  
  severityLines.forEach(line => {
    const severity = line.replace('Severity: ', '').trim();
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
  });
  
  return { eventCounts, severityCounts };
}

async function advancedDebug(states = ['DE'], options = {}) {
  const {
    verbose = false,
    saveResults = false,
    performance = false,
    errorTest = false
  } = options;
  
  console.log('🚀 高级调试模式启动...\n');
  console.log(`📋 测试州: ${states.join(', ')}`);
  console.log(`🔧 选项: verbose=${verbose}, saveResults=${saveResults}, performance=${performance}`);
  console.log('');
  
  const results = [];
  
  for (const state of states) {
    console.log(`\n🔍 开始测试 ${state} 州...`);
    
    // 启动MCP服务器
    const serverProcess = spawn('node', ['build/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let serverResponses = [];
    let serverLogs = [];
    let responseBuffer = '';

    // 监听服务器输出
    serverProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // 尝试解析完整的JSON响应
      const lines = responseBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          const response = parseMCPResponse(line);
          if (response) {
            serverResponses.push(response);
            if (verbose) {
              console.log(`📨 收到响应 (ID: ${response.id}):`, response.result ? '✅' : '❌');
            }
          }
        }
      }
      responseBuffer = lines[lines.length - 1];
    });

    // 监听服务器错误/日志
    serverProcess.stderr.on('data', (data) => {
      const logLine = data.toString().trim();
      serverLogs.push(logLine);
      if (verbose) {
        console.log(`📝 服务器日志:`, logLine);
      }
    });

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testStartTime = Date.now();
    
    try {
      // 1. 初始化
      console.log('  1️⃣ 初始化连接...');
      const initMessage = createMCPMessage(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'advanced-debug', version: '1.0.0' }
      });
      serverProcess.stdin.write(initMessage);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. 获取工具列表
      console.log('  2️⃣ 获取工具列表...');
      const toolsMessage = createMCPMessage(2, 'tools/list', {});
      serverProcess.stdin.write(toolsMessage);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. 性能测试（如果启用）
      if (performance) {
        console.log('  3️⃣ 性能测试模式...');
        const performanceTimes = [];
        
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          const callMessage = createMCPMessage(3 + i, 'tools/call', {
            name: 'get-alerts',
            arguments: { state }
          });
          serverProcess.stdin.write(callMessage);
          await new Promise(resolve => setTimeout(resolve, 2000));
          const endTime = Date.now();
          performanceTimes.push(endTime - startTime);
          console.log(`    测试 ${i + 1}: ${endTime - startTime}ms`);
        }
        
        const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length;
        console.log(`    平均响应时间: ${avgTime.toFixed(2)}ms`);
      }

      // 4. 正常调用
      console.log('  4️⃣ 调用 get-alerts...');
      const callStartTime = Date.now();
      const callMessage = createMCPMessage(10, 'tools/call', {
        name: 'get-alerts',
        arguments: { state }
      });
      serverProcess.stdin.write(callMessage);
      await new Promise(resolve => setTimeout(resolve, 3000));
      const callEndTime = Date.now();

      // 5. 错误测试（如果启用）
      if (errorTest) {
        console.log('  5️⃣ 错误测试...');
        const errorMessage = createMCPMessage(11, 'tools/call', {
          name: 'get-alerts',
          arguments: { state: 'INVALID' }
        });
        serverProcess.stdin.write(errorMessage);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 分析结果
      const testEndTime = Date.now();
      const alertResponse = serverResponses.find(r => r.id === 10);
      
      if (alertResponse && alertResponse.result) {
        const alertsText = alertResponse.result.content[0].text;
        const analysis = analyzeAlerts(alertsText);
        
        const result = {
          state,
          success: true,
          totalTime: testEndTime - testStartTime,
          callTime: callEndTime - callStartTime,
          alertCount: Object.values(analysis.eventCounts).reduce((a, b) => a + b, 0),
          eventTypes: analysis.eventCounts,
          severityTypes: analysis.severityCounts,
          dataSize: alertsText.length,
          logs: serverLogs,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`  ✅ ${state} 州测试完成:`);
        console.log(`     警报数量: ${result.alertCount}`);
        console.log(`     响应时间: ${result.callTime}ms`);
        console.log(`     数据大小: ${result.dataSize} 字符`);
        console.log(`     主要事件类型: ${Object.keys(analysis.eventCounts).slice(0, 3).join(', ')}`);
        
      } else {
        console.log(`  ❌ ${state} 州测试失败`);
        results.push({
          state,
          success: false,
          error: '未收到有效响应',
          logs: serverLogs,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`  ❌ ${state} 州测试异常:`, error.message);
      results.push({
        state,
        success: false,
        error: error.message,
        logs: serverLogs,
        timestamp: new Date().toISOString()
      });
    } finally {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 输出总结
  console.log('\n📊 调试总结:');
  console.log('─'.repeat(50));
  const successCount = results.filter(r => r.success).length;
  console.log(`成功测试: ${successCount}/${results.length}`);
  
  if (successCount > 0) {
    const avgTime = results.filter(r => r.success).reduce((acc, r) => acc + r.callTime, 0) / successCount;
    const totalAlerts = results.filter(r => r.success).reduce((acc, r) => acc + r.alertCount, 0);
    console.log(`平均响应时间: ${avgTime.toFixed(2)}ms`);
    console.log(`总警报数: ${totalAlerts}`);
  }

  // 保存结果到文件
  if (saveResults) {
    const filename = `debug-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`📁 结果已保存到: ${filename}`);
  }

  return results;
}

// 命令行参数解析
const args = process.argv.slice(2);
const states = args.filter(arg => !arg.startsWith('--'));
const options = {
  verbose: args.includes('--verbose'),
  saveResults: args.includes('--save'),
  performance: args.includes('--performance'),
  errorTest: args.includes('--error-test')
};

// 默认测试州
const testStates = states.length > 0 ? states : ['DE'];

// 运行高级调试
advancedDebug(testStates, options).catch(console.error); 