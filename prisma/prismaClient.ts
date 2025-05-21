import { PrismaClient } from "./client";

// Inisiasi PrismaClient sebagai singleton
const prisma = new PrismaClient();

// Export PrismaClient untuk digunakan di seluruh aplikasi
export default prisma;
