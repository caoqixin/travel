/**
 * 性能验证测试脚本
 * 验证系统优化后的性能指标
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 性能测试配置
const TEST_CONFIG = {
  concurrent_users: 5,
  requests_per_user: 10,
  timeout: 10000
};

// 性能指标收集
const metrics = {
  response_times: [],
  success_count: 0,
  error_count: 0,
  start_time: null,
  end_time: null
};

/**
 * 单个请求测试
 */
async function makeRequest(url, method = 'GET', data = null) {
  const start = Date.now();
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Performance-Test-Client'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // 只有2xx状态码才算成功
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = Date.now() - start;
    
    metrics.response_times.push(duration);
    metrics.success_count++;
    
    return {
      success: true,
      duration,
      status: response.status,
      size: response.data ? JSON.stringify(response.data).length : 0
    };
  } catch (error) {
    const duration = Date.now() - start;
    metrics.error_count++;
    
    // 记录详细错误信息
    let errorDetail = error.message;
    if (error.response) {
      errorDetail = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      errorDetail = 'Network Error: No response received';
    }
    
    console.log(`❌ 请求失败 ${url}: ${errorDetail}`);
    
    return {
      success: false,
      duration,
      error: errorDetail,
      status: error.response ? error.response.status : 'NETWORK_ERROR'
    };
  }
}

/**
 * 并发用户模拟
 */
async function simulateUser(userId) {
  console.log(`🚀 用户 ${userId} 开始测试...`);
  
  const userResults = [];
  
  for (let i = 0; i < TEST_CONFIG.requests_per_user; i++) {
    // 测试不同的端点
    const endpoints = [
      '/api/health',
      '/api/flights?page=1&limit=12',
      '/api/flights?page=2&limit=12&sortBy=price',
      '/api/flights?search=北京&page=1&limit=6'
    ];
    
    const endpoint = endpoints[i % endpoints.length];
    const result = await makeRequest(endpoint);
    userResults.push(result);
    
    // 模拟用户思考时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }
  
  console.log(`✅ 用户 ${userId} 完成测试`);
  return userResults;
}

/**
 * 计算性能统计
 */
function calculateStats() {
  const { response_times, success_count, error_count, start_time, end_time } = metrics;
  
  if (response_times.length === 0) {
    return null;
  }
  
  const sorted_times = response_times.sort((a, b) => a - b);
  const total_requests = success_count + error_count;
  const total_duration = end_time - start_time;
  
  return {
    总请求数: total_requests,
    成功请求数: success_count,
    失败请求数: error_count,
    成功率: `${((success_count / total_requests) * 100).toFixed(2)}%`,
    平均响应时间: `${(response_times.reduce((a, b) => a + b, 0) / response_times.length).toFixed(2)}ms`,
    最小响应时间: `${Math.min(...response_times)}ms`,
    最大响应时间: `${Math.max(...response_times)}ms`,
    中位数响应时间: `${sorted_times[Math.floor(sorted_times.length / 2)]}ms`,
    '95%响应时间': `${sorted_times[Math.floor(sorted_times.length * 0.95)]}ms`,
    '99%响应时间': `${sorted_times[Math.floor(sorted_times.length * 0.99)]}ms`,
    总测试时间: `${(total_duration / 1000).toFixed(2)}s`,
    每秒请求数: `${(total_requests / (total_duration / 1000)).toFixed(2)} req/s`
  };
}

/**
 * 生成性能报告
 */
function generateReport(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 性能测试报告');
  console.log('='.repeat(60));
  
  if (!stats) {
    console.log('❌ 无法生成报告：没有收集到性能数据');
    return;
  }
  
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key.padEnd(20)}: ${value}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 性能评估');
  console.log('='.repeat(60));
  
  const avgResponseTime = parseFloat(stats.平均响应时间);
  const successRate = parseFloat(stats.成功率);
  const rps = parseFloat(stats.每秒请求数);
  
  // 性能评级
  let grade = 'A';
  let recommendations = [];
  
  if (avgResponseTime > 1000) {
    grade = 'D';
    recommendations.push('⚠️  平均响应时间过长，需要优化数据库查询和缓存策略');
  } else if (avgResponseTime > 500) {
    grade = 'C';
    recommendations.push('⚠️  响应时间偏高，建议优化API性能');
  } else if (avgResponseTime > 200) {
    grade = 'B';
    recommendations.push('✅ 响应时间良好，可以进一步优化');
  } else {
    recommendations.push('🎉 响应时间优秀！');
  }
  
  if (successRate < 95) {
    grade = 'D';
    recommendations.push('❌ 成功率过低，需要检查错误处理和系统稳定性');
  } else if (successRate < 99) {
    grade = 'C';
    recommendations.push('⚠️  成功率需要提升');
  } else {
    recommendations.push('✅ 成功率优秀');
  }
  
  if (rps < 10) {
    recommendations.push('⚠️  吞吐量偏低，考虑增加并发处理能力');
  } else if (rps > 50) {
    recommendations.push('🚀 吞吐量优秀！');
  }
  
  console.log(`性能等级: ${grade}`);
  console.log('\n建议:');
  recommendations.forEach(rec => console.log(`  ${rec}`));
  
  console.log('\n' + '='.repeat(60));
}

/**
 * 主测试函数
 */
async function runPerformanceTest() {
  console.log('🎯 开始性能验证测试...');
  console.log(`配置: ${TEST_CONFIG.concurrent_users} 并发用户, 每用户 ${TEST_CONFIG.requests_per_user} 请求`);
  
  metrics.start_time = Date.now();
  
  // 创建并发用户
  const userPromises = [];
  for (let i = 1; i <= TEST_CONFIG.concurrent_users; i++) {
    userPromises.push(simulateUser(i));
  }
  
  try {
    // 等待所有用户完成
    await Promise.all(userPromises);
    metrics.end_time = Date.now();
    
    // 计算并显示统计信息
    const stats = calculateStats();
    generateReport(stats);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    metrics.end_time = Date.now();
    
    const stats = calculateStats();
    if (stats) {
      generateReport(stats);
    }
  }
}

// 运行测试
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest, calculateStats };