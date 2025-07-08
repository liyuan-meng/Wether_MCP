import { spawn } from 'child_process';

// 创建MCP消息
function createMCPMessage(id, method, params = {}) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    method,
    params
  }) + '\n';
}

async function debugGetAlerts(state = 'DE') {
  console.log(`🚀 开始调试 get-alerts 方法 (${state} 州)...\n`);
  
  // 启动MCP服务器
  console.log('1️⃣ 启动 MCP 服务器...');
  const serverProcess = spawn('node', ['build/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverOutput = '';
  let responseCount = 0;

  // 监听服务器输出
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
    responseCount++;
    console.log(`📨 服务器响应 ${responseCount}:`, data.toString().trim());
  });

  // 监听服务器错误
  serverProcess.stderr.on('data', (data) => {
    console.log('🔍 服务器错误:', data.toString());
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    console.log('2️⃣ 发送初始化请求...');
    // 发送初始化请求
    const initMessage = createMCPMessage(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'debug-client',
        version: '1.0.0'
      }
    });
    
    serverProcess.stdin.write(initMessage);
    console.log('发送:', initMessage.trim());
    
    // 等待响应
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('3️⃣ 发送工具列表请求...');
    // 请求工具列表
    const toolsMessage = createMCPMessage(2, 'tools/list', {});
    serverProcess.stdin.write(toolsMessage);
    console.log('发送:', toolsMessage.trim());
    
    // 等待响应
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`4️⃣ 调用 get-alerts 方法 (${state} 州)...`);
    // 调用get-alerts工具
    const startTime = Date.now();
    const callMessage = createMCPMessage(3, 'tools/call', {
      name: 'get-alerts',
      arguments: { state }
    });
    
    serverProcess.stdin.write(callMessage);
    console.log('发送:', callMessage.trim());
    
    // 等待响应
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const endTime = Date.now();
    console.log(`\n⏱️ 总耗时: ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  } finally {
    console.log('\n5️⃣ 清理资源...');
    serverProcess.kill();
  }
}

// 从命令行参数获取州代码，默认为 DE
const state = process.argv[2] || 'DE';

// 运行调试
debugGetAlerts(state).catch(console.error); 