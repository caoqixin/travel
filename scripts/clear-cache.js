const { cache } = require('../src/lib/cache.ts');

console.log('清除应用缓存...');

try {
  // 清除内存缓存
  cache.clear();
  console.log('✅ 内存缓存已清除');
  
  console.log('缓存清除完成！');
} catch (error) {
  console.error('❌ 清除缓存时出错:', error);
  process.exit(1);
}