const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const FLIGHT_COLLECTION = 'flights';

// 中国主要城市和机场
const cities = [
  { name: "北京", airport: "首都国际机场", code: "PEK", terminal: "T3" },
  { name: "上海", airport: "浦东国际机场", code: "PVG", terminal: "T2" },
  { name: "广州", airport: "白云国际机场", code: "CAN", terminal: "T2" },
  { name: "深圳", airport: "宝安国际机场", code: "SZX", terminal: "T3" },
  { name: "成都", airport: "双流国际机场", code: "CTU", terminal: "T2" },
  { name: "杭州", airport: "萧山国际机场", code: "HGH", terminal: "T3" },
  { name: "西安", airport: "咸阳国际机场", code: "XIY", terminal: "T3" },
  { name: "重庆", airport: "江北国际机场", code: "CKG", terminal: "T3" },
  { name: "南京", airport: "禄口国际机场", code: "NKG", terminal: "T2" },
  { name: "武汉", airport: "天河国际机场", code: "WUH", terminal: "T3" },
  { name: "青岛", airport: "流亭国际机场", code: "TAO", terminal: "T2" },
  { name: "厦门", airport: "高崎国际机场", code: "XMN", terminal: "T4" }
];

// 航空公司
const airlines = [
  { name: "中国国际航空", code: "CA" },
  { name: "中国东方航空", code: "MU" },
  { name: "中国南方航空", code: "CZ" },
  { name: "海南航空", code: "HU" },
  { name: "深圳航空", code: "ZH" },
  { name: "厦门航空", code: "MF" },
  { name: "四川航空", code: "3U" },
  { name: "春秋航空", code: "9C" }
];

// 本地图片
const localImages = [
  "/images/beijing-flight.svg",
  "/images/shanghai-flight.svg",
  "/images/guangzhou-flight.svg",
  "/images/placeholder.svg",
  "/images/airline-placeholder.svg"
];

// Picsum 图片 URL 生成器（替代 Unsplash）
function getRandomImage(width = 800, height = 600) {
  // 使用 Picsum 服务生成随机图片
  const imageId = Math.floor(Math.random() * 1000) + 1;
  return `https://picsum.photos/${width}/${height}?random=${imageId}`;
}

// 生成随机时间
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机航班号
function generateFlightNumber(airlineCode) {
  return `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`;
}

// 生成随机价格
function getRandomPrice(min = 300, max = 2000) {
  return Math.floor(Math.random() * (max - min) + min);
}

// 生成飞行时间
function generateFlightDuration(departure, arrival) {
  const durations = ["1小时30分钟", "2小时15分钟", "2小时45分钟", "3小时20分钟", "4小时10分钟"];
  return durations[Math.floor(Math.random() * durations.length)];
}

// 生成直飞航班
function generateDirectFlight(useOnlineImage = true) {
  const departure = cities[Math.floor(Math.random() * cities.length)];
  let arrival;
  do {
    arrival = cities[Math.floor(Math.random() * cities.length)];
  } while (arrival.code === departure.code);

  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const price = getRandomPrice();
  const discountPrice = Math.floor(price * 0.8);
  
  const departureTime = getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const arrivalTime = new Date(departureTime.getTime() + (2 + Math.random() * 3) * 60 * 60 * 1000);

  return {
    _id: new ObjectId(),
    title: `${departure.name} - ${arrival.name} 经济舱`,
    description: `舒适的经济舱座位，${airline.name}直飞航班`,
    image: useOnlineImage ? getRandomImage(800, 600) : localImages[Math.floor(Math.random() * localImages.length)],
    price: price,
    discountPrice: discountPrice,
    departure: {
      city: departure.name,
      airport: departure.airport,
      code: departure.code,
      terminal: departure.terminal,
      time: departureTime
    },
    arrival: {
      city: arrival.name,
      airport: arrival.airport,
      code: arrival.code,
      terminal: arrival.terminal,
      time: arrivalTime
    },
    flightNumber: generateFlightNumber(airline.code),
    flightDuration: generateFlightDuration(departure, arrival),
    layovers: [],
    type: "one-way",
    airline: {
      name: airline.name,
      code: airline.code
    },
    stops: 0,
    baggage: {
      cabin: {
        weight: "7kg",
        quantity: 1
      },
      checked: {
        weight: "20kg",
        quantity: 1
      }
    },
    amenities: ["免费餐食", "机上娱乐", "WiFi", "USB充电"],
    status: "active",
    tags: ["直飞", "热门"],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// 生成转机航班
function generateConnectingFlight(useOnlineImage = true) {
  const departure = cities[Math.floor(Math.random() * cities.length)];
  let arrival, layover;
  
  do {
    arrival = cities[Math.floor(Math.random() * cities.length)];
  } while (arrival.code === departure.code);
  
  do {
    layover = cities[Math.floor(Math.random() * cities.length)];
  } while (layover.code === departure.code || layover.code === arrival.code);

  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const price = getRandomPrice(400, 1500);
  const discountPrice = Math.floor(price * 0.85);
  
  const departureTime = getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const layoverArrival = new Date(departureTime.getTime() + (1.5 + Math.random() * 2) * 60 * 60 * 1000);
  const layoverDeparture = new Date(layoverArrival.getTime() + (1 + Math.random() * 3) * 60 * 60 * 1000);
  const arrivalTime = new Date(layoverDeparture.getTime() + (1.5 + Math.random() * 2) * 60 * 60 * 1000);

  return {
    _id: new ObjectId(),
    title: `${departure.name} - ${arrival.name} 经济舱 (经${layover.name})`,
    description: `经济舱座位，${airline.name}转机航班，经停${layover.name}`,
    image: useOnlineImage ? getRandomImage(800, 600) : localImages[Math.floor(Math.random() * localImages.length)],
    price: price,
    discountPrice: discountPrice,
    departure: {
      city: departure.name,
      airport: departure.airport,
      code: departure.code,
      terminal: departure.terminal,
      time: departureTime
    },
    arrival: {
      city: arrival.name,
      airport: arrival.airport,
      code: arrival.code,
      terminal: arrival.terminal,
      time: arrivalTime
    },
    flightNumber: generateFlightNumber(airline.code),
    flightDuration: generateFlightDuration(departure, arrival),
    layovers: [{
      city: layover.name,
      airport: layover.airport,
      code: layover.code,
      terminal: layover.terminal,
      flightNumber: generateFlightNumber(airline.code),
      arrivalTime: layoverArrival,
      departureTime: layoverDeparture,
      duration: `${Math.floor((layoverDeparture - layoverArrival) / (60 * 60 * 1000))}小时${Math.floor(((layoverDeparture - layoverArrival) % (60 * 60 * 1000)) / (60 * 1000))}分钟`
    }],
    type: "one-way",
    airline: {
      name: airline.name,
      code: airline.code
    },
    stops: 1,
    baggage: {
      cabin: {
        weight: "7kg",
        quantity: 1
      },
      checked: {
        weight: "20kg",
        quantity: 1
      }
    },
    amenities: ["免费餐食", "机上娱乐", "WiFi"],
    status: "active",
    tags: ["转机", "经济实惠"],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function generateTestFlights() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(FLIGHT_COLLECTION);
    
    console.log('🚀 开始生成测试航班数据...');
    
    // 生成30条直飞航班 (20条在线图片 + 10条本地图片)
    console.log('📝 生成直飞航班数据...');
    const directFlights = [];
    
    // 20条使用在线图片
    for (let i = 0; i < 20; i++) {
      directFlights.push(generateDirectFlight(true));
    }
    
    // 10条使用本地图片
    for (let i = 0; i < 10; i++) {
      directFlights.push(generateDirectFlight(false));
    }
    
    const directResult = await collection.insertMany(directFlights);
    console.log(`✅ 成功创建 ${directResult.insertedCount} 条直飞航班`);
    
    // 生成30条转机航班 (20条在线图片 + 10条本地图片)
    console.log('📝 生成转机航班数据...');
    const connectingFlights = [];
    
    // 20条使用在线图片
    for (let i = 0; i < 20; i++) {
      connectingFlights.push(generateConnectingFlight(true));
    }
    
    // 10条使用本地图片
    for (let i = 0; i < 10; i++) {
      connectingFlights.push(generateConnectingFlight(false));
    }
    
    const connectingResult = await collection.insertMany(connectingFlights);
    console.log(`✅ 成功创建 ${connectingResult.insertedCount} 条转机航班`);
    
    console.log(`🎉 总共生成 ${directResult.insertedCount + connectingResult.insertedCount} 条测试航班数据`);
    
  } catch (error) {
    console.error('❌ 生成测试数据失败:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

generateTestFlights();