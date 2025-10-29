import { getDatabase } from './mongodb';
import { FLIGHT_COLLECTION } from './models/Flight';

// 数据库索引优化
export async function createOptimalIndexes() {
  try {
    const db = await getDatabase();
    const collection = db.collection(FLIGHT_COLLECTION);

    // 创建复合索引以优化常见查询
    const indexes = [
      // 状态 + 价格索引 (用于航班列表查询)
      { status: 1, price: 1 },
      
      // 状态 + 出发时间索引 (用于按时间排序)
      { status: 1, "departure.time": 1 },
      
      // 城市搜索索引 (用于目的地搜索)
      { "departure.city": "text", "arrival.city": "text" },
      
      // 复合搜索索引
      { status: 1, "departure.city": 1, "arrival.city": 1 },
      
      // 管理员查询索引
      { createdAt: -1 },
      { updatedAt: -1 },
      
      // 价格范围查询索引
      { status: 1, price: 1, "departure.time": 1 },
    ] as const;

    console.log('🔧 开始创建数据库索引...');
    
    for (const index of indexes) {
      try {
        await collection.createIndex(index);
        console.log(`✅ 索引创建成功:`, index);
      } catch (error) {
        console.log(`⚠️ 索引可能已存在:`, index);
      }
    }

    console.log('🎉 数据库索引优化完成!');
    return true;
  } catch (error) {
    console.error('❌ 数据库索引创建失败:', error);
    return false;
  }
}

// 查询性能分析
export async function analyzeQueryPerformance(query: any, collection: string = FLIGHT_COLLECTION) {
  try {
    const db = await getDatabase();
    const coll = db.collection(collection);
    
    // 使用 explain() 分析查询性能
    const explanation = await coll.find(query).explain('executionStats');
    
    const stats = explanation.executionStats;
    const performance = {
      totalDocsExamined: stats.totalDocsExamined,
      totalDocsReturned: stats.totalDocsReturned,
      executionTimeMillis: stats.executionTimeMillis,
      indexesUsed: explanation.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN',
      efficiency: stats.totalDocsReturned / stats.totalDocsExamined || 0,
    };

    // 性能建议
    const suggestions = [];
    if (performance.efficiency < 0.1) {
      suggestions.push('查询效率较低，建议添加适当的索引');
    }
    if (performance.indexesUsed === 'COLLSCAN') {
      suggestions.push('查询未使用索引，建议创建相关索引');
    }
    if (performance.executionTimeMillis > 100) {
      suggestions.push('查询执行时间较长，建议优化查询条件或索引');
    }

    return {
      performance,
      suggestions,
    };
  } catch (error) {
    console.error('查询性能分析失败:', error);
    return null;
  }
}

// 优化的航班查询函数
export async function optimizedFlightQuery(
  query: any,
  options: {
    page?: number;
    limit?: number;
    sort?: any;
    projection?: any;
  } = {}
) {
  const db = await getDatabase();
  const collection = db.collection(FLIGHT_COLLECTION);

  const {
    page = 1,
    limit = 10,
    sort = { price: 1 },
    projection = null,
  } = options;

  // 使用聚合管道优化查询
  const pipeline: any[] = [
    { $match: query },
    { $sort: sort },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  if (projection) {
    pipeline.push({ $project: projection });
  }

  const [results, totalCount] = await Promise.all([
    collection.aggregate(pipeline).toArray(),
    collection.countDocuments(query),
  ]);

  return {
    results,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

// 批量操作优化
export async function bulkUpdateFlights(updates: Array<{ filter: any; update: any }>) {
  const db = await getDatabase();
  const collection = db.collection(FLIGHT_COLLECTION);

  const bulkOps = updates.map(({ filter, update }) => ({
    updateOne: {
      filter,
      update: { $set: { ...update, updatedAt: new Date() } },
    },
  }));

  return await collection.bulkWrite(bulkOps);
}

// 数据库连接池优化
export function optimizeConnectionPool() {
  // 这些配置应该在 mongodb.ts 中设置
  return {
    maxPoolSize: 10,        // 最大连接数
    minPoolSize: 2,         // 最小连接数
    maxIdleTimeMS: 30000,   // 连接空闲时间
    serverSelectionTimeoutMS: 5000, // 服务器选择超时
    socketTimeoutMS: 45000, // Socket超时
    bufferMaxEntries: 0,    // 禁用缓冲
  };
}

// 缓存预热
export async function warmupCache() {
  console.log('🔥 开始缓存预热...');
  
  try {
    // 预热常用查询
    const commonQueries = [
      { status: 'active' }, // 活跃航班
      { status: 'active', price: { $lt: 1000 } }, // 低价航班
      { status: 'active', 'departure.city': '北京' }, // 北京出发
      { status: 'active', 'arrival.city': '上海' }, // 到达上海
    ];

    for (const query of commonQueries) {
      await optimizedFlightQuery(query, { limit: 20 });
    }

    console.log('✅ 缓存预热完成');
    return true;
  } catch (error) {
    console.error('❌ 缓存预热失败:', error);
    return false;
  }
}