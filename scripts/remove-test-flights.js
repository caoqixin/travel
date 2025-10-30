const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const FLIGHT_COLLECTION = 'flights';

async function removeTestFlights() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(FLIGHT_COLLECTION);
    
    // 查看当前总数
    const totalCount = await collection.countDocuments();
    console.log(`当前总航班数量: ${totalCount}`);
    
    // 保留最早的2个航班（原有数据：米兰-温州）
    // 删除除了米兰-温州航班之外的所有航班
    const toDelete = await collection.find({ 
      title: { $not: /米兰.*温州/ }
    }).toArray();
    
    console.log(`\n将要删除的测试航班数量: ${toDelete.length}`);
    console.log('前5个要删除的航班:');
    toDelete.slice(0, 5).forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.title} - 创建时间: ${flight.createdAt}`);
    });
    
    // 执行删除
    const result = await collection.deleteMany({ 
      title: { $not: /米兰.*温州/ }
    });
    
    console.log(`\n✅ 成功删除 ${result.deletedCount} 条测试航班数据`);
    
    // 查看剩余数据
    const remainingCount = await collection.countDocuments();
    console.log(`剩余航班数量: ${remainingCount}`);
    
    const remainingFlights = await collection.find({}).sort({ createdAt: 1 }).toArray();
    console.log('\n保留的航班:');
    remainingFlights.forEach((flight, index) => {
      console.log(`${index + 1}. ${flight.title} - 创建时间: ${flight.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ 删除测试航班数据失败:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n数据库连接已关闭');
  }
}

removeTestFlights();