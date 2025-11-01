"use server";

import { FLIGHT_COLLECTION, IFlight } from "@/lib/models/Flight";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function getFlights() {
  const db = await getDatabase();
  const collection = db.collection<IFlight>(FLIGHT_COLLECTION);

  return collection.find({}).toArray();
}

export async function getFlightById(id: string) {
  const db = await getDatabase();
  const collection = db.collection<IFlight>(FLIGHT_COLLECTION);

  if (!ObjectId.isValid(id)) {
    return { error: "Invalid flight ID", success: false, data: null };
  }

  const flight = await collection.findOne({ _id: new ObjectId(id) });

  if (!flight) {
    return {
      success: false,
      error: "Flight not found",
      data: null,
    };
  }

  return {
    success: true,
    data: flight,
  };
}
