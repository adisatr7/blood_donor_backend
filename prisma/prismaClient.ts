import { PrismaClient } from "./client";

// Initialize Prisma Client to connect to the database
const prisma = new PrismaClient();

// Export it for use in other parts of the application
export default prisma;
