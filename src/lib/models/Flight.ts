import { ObjectId } from "mongodb";

export interface IFlight {
  _id: ObjectId;
  title: string;
  description?: string;
  image: string;
  price: number;
  discountPrice?: number;
  departure: {
    city: string;
    airport: string;
    code: string;
    terminal: string; // 候机楼
    time: Date;
  };
  arrival: {
    city: string;
    airport: string;
    code: string;
    terminal: string; // 候机楼
    time: Date;
  };
  // 航班号
  flightNumber: string;
  // 飞行时间
  flightDuration: string;
  // 中转航班信息
  layovers?: {
    city: string;
    airport: string;
    code: string;
    terminal: string; // 候机楼
    flightNumber: string; // 中转航班号
    arrivalTime: Date;
    departureTime: Date;
    duration: string; // 中转等待时间
  }[];
  returnFlight?: {
    departure: {
      city: string;
      airport: string;
      code: string;
      terminal: string; // 候机楼
      time: Date;
    };
    arrival: {
      city: string;
      airport: string;
      code: string;
      terminal: string; // 候机楼
      time: Date;
    };
    // 返程航班号
    flightNumber: string;
    // 返程飞行时间
    flightDuration: string;
    // 返程中转航班信息
    layovers?: {
      city: string;
      airport: string;
      code: string;
      terminal: string; // 候机楼
      flightNumber: string; // 中转航班号
      arrivalTime: Date;
      departureTime: Date;
      duration: string;
    }[];
  };
  type: "one-way" | "round-trip";
  airline: {
    name: string;
    code: string;
  };
  stops: number; // 自动计算的经停次数
  baggage: {
    cabin: {
      weight: string; // 手提行李重量
      quantity: number; // 手提行李数量
    };
    checked: {
      weight: string; // 托运行李重量
      quantity: number; // 托运行李数量
    };
  };
  amenities: string[];
  status: "active" | "inactive" | "sold-out";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB 集合名称
export const FLIGHT_COLLECTION = "flights";

// 航班验证函数
export function validateFlight(flight: Partial<IFlight>): string[] {
  const errors: string[] = [];

  if (!flight.title || flight.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (!flight.image || flight.image.trim().length === 0) {
    errors.push("Image is required");
  }

  if (!flight.flightNumber || flight.flightNumber.trim().length === 0) {
    errors.push("Flight number is required");
  }

  if (!flight.flightDuration || flight.flightDuration.trim().length === 0) {
    errors.push("Flight duration is required");
  }

  if (flight.price !== undefined && flight.price <= 0) {
    errors.push("Price must be greater than 0");
  }

  if (flight.discountPrice !== undefined && flight.discountPrice <= 0) {
    errors.push("Discount price must be greater than 0");
  }

  if (
    flight.price !== undefined &&
    flight.discountPrice !== undefined &&
    flight.discountPrice >= flight.price
  ) {
    errors.push("Discount price must be less than regular price");
  }

  if (flight.type && !["one-way", "round-trip"].includes(flight.type)) {
    errors.push("Type must be either 'one-way' or 'round-trip'");
  }

  if (
    flight.status &&
    !["active", "inactive", "sold-out"].includes(flight.status)
  ) {
    errors.push("Status must be 'active', 'inactive', or 'sold-out'");
  }

  if (flight.stops !== undefined && flight.stops < 0) {
    errors.push("Stops cannot be negative");
  }

  // 验证往返航班信息
  if (flight.type === "round-trip" && flight.returnFlight) {
    if (!flight.returnFlight.flightNumber || flight.returnFlight.flightNumber.trim().length === 0) {
      errors.push("Return flight number is required for round-trip flights");
    }
    if (!flight.returnFlight.flightDuration || flight.returnFlight.flightDuration.trim().length === 0) {
      errors.push("Return flight duration is required for round-trip flights");
    }
  }

  return errors;
}

// 创建航班的默认值
export function createFlightDefaults(flightData: Partial<IFlight>): IFlight {
  const now = new Date();
  
  // 自动计算经停次数
  const calculateStops = (layovers?: IFlight['layovers']): number => {
    return layovers ? layovers.length : 0;
  };

  return {
    _id: new ObjectId(),
    title: flightData.title!,
    description: flightData.description,
    image: flightData.image!,
    price: flightData.price!,
    discountPrice: flightData.discountPrice,
    departure: flightData.departure!,
    arrival: flightData.arrival!,
    flightNumber: flightData.flightNumber!,
    flightDuration: flightData.flightDuration!,
    layovers: flightData.layovers,
    returnFlight: flightData.returnFlight,
    type: flightData.type!,
    airline: flightData.airline!,
    stops: calculateStops(flightData.layovers),
    baggage: flightData.baggage || {
      cabin: { weight: "", quantity: 1 },
      checked: { weight: "", quantity: 1 }
    },
    amenities: flightData.amenities || [],
    status: flightData.status || "active",
    tags: flightData.tags || [],
    createdAt: flightData.createdAt || now,
    updatedAt: flightData.updatedAt || now,
  };
}
