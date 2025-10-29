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
  { name: "杭州", airport: "萧山国际机场", code: "HGH", terminal: "T3" }
];

// 航空公司
const airlines = [
  { name: "中国国际航空", code: "CA" },
  { name: "中国东方航空", code: "MU" },
  { name: "中国南方航空", code: "CZ" },
  { name: "海南航空", code: "HU" }
];

// 本地图片
const localImages = [
  "/images/beijing-flight.svg",
  "/images/shanghai-flight.svg",
  "/images/guangzhou-flight.svg",
  "/images/placeholder.svg"
];

// 生成随机时间
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机航班号
function generateFlightNumber(airlineCode) {
  return `${airlineCode}${Math.floor(Math.random() * 9000) + 1000}`;
}

// 生成随机价格
function getRandomPrice(min = 500, max = 3000) {
  return Math.floor(Math.random() * (max - min) + min);
}

// 生成往返航班
function generateRoundTripFlight() {
  const departure = cities[Math.floor(Math.random() * cities.length)];
  let arrival;
  do {
    arrival = cities[Math.floor(Math.random() * cities.length)];
  } while (arrival.code === departure.code);

  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const price = getRandomPrice();
  const discountPrice = Math.floor(price * 0.85);
  
  // 去程时间
  const outboundDepartureTime = getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const outboundArrivalTime = new Date(outboundDepartureTime.getTime() + (2 + Math.random() * 3) * 60 * 60 * 1000);
  
  // 返程时间（去程后1-7天）
  const returnDepartureTime = new Date(outboundArrivalTime.getTime() + (1 + Math.random() * 6) * 24 * 60 * 60 * 1000);
  const returnArrivalTime = new Date(returnDepartureTime.getTime() + (2 + Math.random() * 3) * 60 * 60 * 1000);

  return {
    _id: new ObjectId(),
    title: `${departure.name} ⇄ ${arrival.name} 往返经济舱`,
    description: `舒适的往返经济舱座位，${airline.name}直飞航班`,
    image: localImages[Math.floor(Math.random() * localImages.length)],
    price: price,
    discountPrice: discountPrice,
    departure: {
      city: departure.name,
      airport: departure.airport,
      code: departure.code,
      terminal: departure.terminal,
      time: outboundDepartureTime
    },
    arrival: {
      city: arrival.name,
      airport: arrival.airport,
      code: arrival.code,
      terminal: arrival.terminal,
      time: outboundArrivalTime
    },
    flightNumber: generateFlightNumber(airline.code),
    flightDuration: "2小时30分钟",
    layovers: [],
    type: "round-trip",
    returnFlight: {
      departure: {
        city: arrival.name,
        airport: arrival.airport,
        code: arrival.code,
        terminal: arrival.terminal,
        time: returnDepartureTime
      },
      arrival: {
        city: departure.name,
        airport: departure.airport,
        code: departure.code,
        terminal: departure.terminal,
        time: returnArrivalTime
      },
      flightNumber: generateFlightNumber(airline.code) + "R",
      flightDuration: "2小时30分钟"
    },
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
    tags: ["往返", "直飞", "热门"],
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
    
    console.log('🚀 开始生成往返航班测试数据...');
    
    // 生成10条往返航班
    const roundTripFlights = [];
    for (let i = 0; i < 10; i++) {
      roundTripFlights.push(generateRoundTripFlight());
    }
    
    const result = await collection.insertMany(roundTripFlights);
    console.log(`✅ 成功创建 ${result.insertedCount} 条往返航班`);
    
    console.log('🎉 往返航班测试数据生成完成');
    
  } catch (error) {
    console.error('❌ 生成测试数据时出错:', error);
  } finally {
    await client.close();
    console.log('数据库连接已关闭');
  }
}

generateTestFlights();