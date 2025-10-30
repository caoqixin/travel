const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const FLIGHT_COLLECTION = 'flights';

async function checkFlights() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(FLIGHT_COLLECTION);
    
    const count = await collection.countDocuments();
    console.log('总航班数量:', count);
    
    // 查看最近创建的航班（我创建的测试数据）
    const recentFlights = await collection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log('\n最近的航班:');
    recentFlights.forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.title} - 创建时间: ${flight.createdAt}`);
    });
    
    // 查看最早的航班（原有数据）
    const oldFlights = await collection.find({}).sort({ createdAt: 1 }).limit(5).toArray();
    console.log('\n最早的航班:');
    oldFlights.forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.title} - 创建时间: ${flight.createdAt}`);
    });
    
    // 查看今天创建的航班（测试数据）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFlights = await collection.find({ 
      createdAt: { $gte: today } 
    }).toArray();
    console.log(`\n今天创建的航班数量: ${todayFlights.length}`);
    
  } catch (error) {
    console.error('❌ 查看航班数据失败:', error);
  } finally {
    await client.close();
    console.log('\n数据库连接已关闭');
  }
}

checkFlights();