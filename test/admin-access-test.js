const BASE_URL = 'http://localhost:3000';

async function testAdminAccess() {
  console.log('🧪 测试Admin访问流程...\n');

  try {
    // 测试1: 直接访问 /admin/dashboard (没有密钥)
    console.log('📋 测试1: 未提供密钥访问 /admin/dashboard');
    try {
      const response1 = await fetch(`${BASE_URL}/admin/dashboard`, {
        redirect: 'manual'
      });
      
      if (response1.status === 302 || response1.status === 307) {
        const location = response1.headers.get('location');
        if (location && location.includes('/admin/access')) {
          console.log('✅ 正确重定向到密钥输入页面:', location);
        } else {
          console.log('❌ 重定向位置不正确:', location);
        }
      } else {
        console.log('❌ 应该重定向但没有重定向, 状态码:', response1.status);
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.message);
    }

    // 测试2: 访问密钥输入页面
    console.log('\n📋 测试2: 访问密钥输入页面');
    try {
      const response2 = await fetch(`${BASE_URL}/admin/access`);
      if (response2.status === 200) {
        console.log('✅ 密钥输入页面正常访问');
      } else {
        console.log('❌ 密钥输入页面访问失败, 状态码:', response2.status);
      }
    } catch (error) {
      console.log('❌ 访问密钥输入页面失败:', error.message);
    }

    // 测试3: 验证错误的密钥
    console.log('\n📋 测试3: 验证错误的密钥');
    try {
      const response3 = await fetch(`${BASE_URL}/api/admin/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessKey: 'wrong-key'
        })
      });
      
      if (response3.status === 401) {
        console.log('✅ 错误密钥正确被拒绝');
      } else {
        console.log('❌ 错误密钥验证结果不正确, 状态码:', response3.status);
      }
    } catch (error) {
      console.log('❌ 验证错误密钥失败:', error.message);
    }

    // 测试4: 验证正确的密钥
    console.log('\n📋 测试4: 验证正确的密钥');
    try {
      const response4 = await fetch(`${BASE_URL}/api/admin/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessKey: 'lunatech2024admin'
        })
      });
      
      const data4 = await response4.json();
      if (response4.status === 200 && data4.success) {
        console.log('✅ 正确密钥验证成功');
      } else {
        console.log('❌ 正确密钥验证失败, 状态码:', response4.status);
      }
    } catch (error) {
      console.log('❌ 验证正确密钥失败:', error.message);
    }

    // 测试5: 带有正确密钥cookie访问admin页面
    console.log('\n📋 测试5: 带有正确密钥cookie访问admin页面');
    try {
      const response5 = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: {
          'Cookie': 'admin-access-key=lunatech2024admin'
        },
        redirect: 'manual'
      });
      
      if (response5.status === 302 || response5.status === 307) {
        const location = response5.headers.get('location');
        if (location && location.includes('/admin/login')) {
          console.log('✅ 有密钥但未登录，正确重定向到登录页面:', location);
        } else {
          console.log('❌ 重定向位置不正确:', location);
        }
      } else if (response5.status === 200) {
        console.log('✅ 已登录用户正常访问dashboard');
      } else {
        console.log('❌ 访问结果不符合预期, 状态码:', response5.status);
      }
    } catch (error) {
      console.log('❌ 带密钥访问失败:', error.message);
    }

    // 测试6: 测试404页面重定向
    console.log('\n📋 测试6: 测试404页面重定向');
    try {
      const response6 = await fetch(`${BASE_URL}/non-existent-page`, {
        redirect: 'manual'
      });
      
      if (response6.status === 404) {
        console.log('✅ 不存在的页面返回404状态码');
        // 注意：Next.js的404重定向可能需要在实际浏览器中测试
      } else if (response6.status === 302 || response6.status === 307) {
        const location = response6.headers.get('location');
        if (location === '/' || location.includes('localhost:3000/')) {
          console.log('✅ 404页面正确重定向到首页');
        } else {
          console.log('❌ 404重定向位置不正确:', location);
        }
      } else {
        console.log('⚠️  404测试结果:', response6.status, '(可能需要在浏览器中测试)');
      }
    } catch (error) {
      console.log('❌ 404测试失败:', error.message);
    }

    console.log('\n🎉 Admin访问流程测试完成!');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testAdminAccess();