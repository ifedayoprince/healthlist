import { drizzle } from "drizzle-orm/node-postgres";
import env from "../env.js";
import { relations } from "./relations.js";

const db = drizzle(env.DATABASE_URL, { relations });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export default db;