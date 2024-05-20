import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define and export the environment variables
export const dbHost: string = process.env.DB_HOST as string;
export const dbUser: string = process.env.DB_USER as string;
export const dbPort: number = parseInt(process.env.DB_PORT as string, 10);
export const dbPassword: string = process.env.DB_PASSWORD as string;
export const dbName: string = process.env.DB_NAME as string;
export const port: number = parseInt(process.env.PORT as string, 10);


// Export all as default
export default {
  dbHost,
  dbUser,
  dbPort,
  dbPassword,
  dbName,
  port,
};
