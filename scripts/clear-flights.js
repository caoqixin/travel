const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const FLIGHT_COLLECTION = 'flights';

async function clearAllFlights() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(FLIGHT_COLLECTION);
    
    // 删除所有航班数据
    const result = await collection.deleteMany({});
    
    console.log(`✅ 成功删除 ${result.deletedCount} 条航班数据`);
    
  } catch (error) {
    console.error('❌ 删除航班数据失败:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

clearAllFlights();