const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const FLIGHT_COLLECTION = 'flights';

// 本地图片数组
const localImages = [
  "/images/beijing-flight.svg",
  "/images/shanghai-flight.svg", 
  "/images/guangzhou-flight.svg",
  "/images/placeholder.svg",
  "/images/airline-placeholder.svg"
];

async function fixImageUrls() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(FLIGHT_COLLECTION);
    
    // 查找所有使用在线图片的航班
    const onlineImageFlights = await collection.find({
      image: { $regex: '^https://picsum' }
    }).toArray();
    
    console.log(`🔍 找到 ${onlineImageFlights.length} 条使用在线图片的航班记录`);
    
    if (onlineImageFlights.length === 0) {
      console.log('✅ 没有需要修复的图片URL');
      return;
    }
    
    console.log('🔄 开始更新图片URL...');
    
    // 批量更新操作
    const bulkOps = onlineImageFlights.map(flight => {
      // 随机选择一个本地图片
      const randomLocalImage = localImages[Math.floor(Math.random() * localImages.length)];
      
      return {
        updateOne: {
          filter: { _id: flight._id },
          update: { 
            $set: { 
              image: randomLocalImage,
              updatedAt: new Date()
            }
          }
        }
      };
    });
    
    // 执行批量更新
    const result = await collection.bulkWrite(bulkOps);
    
    console.log(`✅ 成功更新 ${result.modifiedCount} 条航班记录的图片URL`);
    
    // 验证更新结果
    const remainingOnlineImages = await collection.countDocuments({
      image: { $regex: '^https://picsum' }
    });
    
    console.log(`📊 剩余使用在线图片的记录: ${remainingOnlineImages} 条`);
    
    if (remainingOnlineImages === 0) {
      console.log('🎉 所有图片URL已成功修复为本地图片！');
    }
    
  } catch (error) {
    console.error('❌ 修复图片URL失败:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

fixImageUrls();