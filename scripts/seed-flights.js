const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const sampleFlights = [
  {
    title: "北京 - 上海 经济舱特价",
    description: "舒适的经济舱座位，含餐食和行李",
    image: "/images/beijing-flight.svg",
    price: 580,
    originalPrice: 780,
    type: "one-way",
    departure: {
      city: "北京",
      airport: "首都国际机场",
      code: "PEK",
      time: "2024-02-15T08:30:00Z"
    },
    arrival: {
      city: "上海",
      airport: "浦东国际机场", 
      code: "PVG",
      time: "2024-02-15T11:00:00Z"
    },
    airline: {
      name: "中国国际航空",
      code: "CA",
      logo: "/images/airline-placeholder.svg"
    },
    aircraft: {
      model: "Boeing 737-800",
      registration: "B-1234"
    },
    duration: {
      outbound: "2小时30分钟"
    },
    stops: 0,
    baggage: {
      cabin: "7kg随身行李",
      checked: "20kg免费托运"
    },
    amenities: ["免费餐食", "机上娱乐", "WiFi", "USB充电"],
    tags: ["特价", "热门", "直飞"],
    status: "active",
    availableSeats: 120,
    totalSeats: 180,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "上海 - 广州 往返套票",
    description: "往返套票优惠，商务舱体验",
    image: "/images/shanghai-flight.svg",
    price: 1280,
    originalPrice: 1580,
    type: "round-trip",
    departure: {
      city: "上海",
      airport: "虹桥国际机场",
      code: "SHA",
      time: "2024-02-16T14:20:00Z"
    },
    arrival: {
      city: "广州",
      airport: "白云国际机场",
      code: "CAN", 
      time: "2024-02-16T17:10:00Z"
    },
    returnFlight: {
      departure: {
        city: "广州",
        airport: "白云国际机场",
        code: "CAN",
        time: "2024-02-20T09:15:00Z"
      },
      arrival: {
        city: "上海", 
        airport: "虹桥国际机场",
        code: "SHA",
        time: "2024-02-20T12:05:00Z"
      }
    },
    airline: {
      name: "南方航空",
      code: "CZ",
      logo: "/images/airline-placeholder.svg"
    },
    aircraft: {
      model: "Airbus A320",
      registration: "B-5678"
    },
    duration: {
      outbound: "2小时50分钟",
      return: "2小时50分钟"
    },
    stops: 0,
    baggage: {
      cabin: "10kg随身行李",
      checked: "30kg免费托运"
    },
    amenities: ["商务餐食", "平躺座椅", "优先登机", "贵宾休息室"],
    tags: ["往返", "商务舱", "优惠"],
    status: "active",
    availableSeats: 24,
    totalSeats: 32,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "深圳 - 成都 红眼航班",
    description: "夜间航班，价格实惠",
    image: "/images/guangzhou-flight.svg",
    price: 420,
    originalPrice: 650,
    type: "one-way",
    departure: {
      city: "深圳",
      airport: "宝安国际机场",
      code: "SZX",
      time: "2024-02-17T23:45:00Z"
    },
    arrival: {
      city: "成都",
      airport: "双流国际机场",
      code: "CTU",
      time: "2024-02-18T02:30:00Z"
    },
    airline: {
      name: "四川航空",
      code: "3U",
      logo: "/images/airline-placeholder.svg"
    },
    aircraft: {
      model: "Airbus A321",
      registration: "B-9012"
    },
    duration: {
      outbound: "2小时45分钟"
    },
    stops: 0,
    baggage: {
      cabin: "7kg随身行李",
      checked: "20kg免费托运"
    },
    amenities: ["简餐", "毛毯", "眼罩"],
    tags: ["红眼航班", "特价", "经济实惠"],
    status: "active",
    availableSeats: 95,
    totalSeats: 180,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "杭州 - 西安 中转联程",
    description: "经济舱中转航班，性价比高",
    image: "/images/beijing-flight.svg",
    price: 380,
    originalPrice: 520,
    type: "one-way",
    departure: {
      city: "杭州",
      airport: "萧山国际机场",
      code: "HGH",
      time: "2024-02-18T10:30:00Z"
    },
    arrival: {
      city: "西安",
      airport: "咸阳国际机场",
      code: "XIY",
      time: "2024-02-18T16:20:00Z"
    },
    airline: {
      name: "东方航空",
      code: "MU",
      logo: "/images/airline-placeholder.svg"
    },
    aircraft: {
      model: "Boeing 737-700",
      registration: "B-3456"
    },
    duration: {
      outbound: "5小时50分钟"
    },
    stops: 1,
    baggage: {
      cabin: "7kg随身行李",
      checked: "20kg免费托运"
    },
    amenities: ["免费餐食", "机上娱乐"],
    tags: ["中转", "经济实惠"],
    status: "active",
    availableSeats: 78,
    totalSeats: 150,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "青岛 - 昆明 春城之旅",
    description: "前往春城昆明，享受四季如春的气候",
    image: "/images/shanghai-flight.svg",
    price: 890,
    originalPrice: 1120,
    type: "one-way",
    departure: {
      city: "青岛",
      airport: "流亭国际机场",
      code: "TAO",
      time: "2024-02-19T13:15:00Z"
    },
    arrival: {
      city: "昆明",
      airport: "长水国际机场",
      code: "KMG",
      time: "2024-02-19T17:45:00Z"
    },
    airline: {
      name: "昆明航空",
      code: "KY",
      logo: "/images/airline-placeholder.svg"
    },
    aircraft: {
      model: "Boeing 737-800",
      registration: "B-7890"
    },
    duration: {
      outbound: "4小时30分钟"
    },
    stops: 0,
    baggage: {
      cabin: "7kg随身行李",
      checked: "20kg免费托运"
    },
    amenities: ["免费餐食", "机上娱乐", "云南特色小食"],
    tags: ["直飞", "旅游", "春城"],
    status: "active",
    availableSeats: 142,
    totalSeats: 180,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedFlights() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('travel-flights');
    const collection = db.collection('flights');
    
    // 清空现有数据
    await collection.deleteMany({});
    console.log('Cleared existing flights');
    
    // 插入示例数据
    const result = await collection.insertMany(sampleFlights);
    console.log(`Inserted ${result.insertedCount} sample flights`);
    
    console.log('Sample flights added successfully!');
  } catch (error) {
    console.error('Error seeding flights:', error);
  } finally {
    await client.close();
  }
}

seedFlights();