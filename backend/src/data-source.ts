import { DataSource } from 'typeorm';

import { User } from './models/User';
import { RegisterGuarantees } from './models/RegisterGuarantees';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'test',
    synchronize: true,
    logging: false,
    entities: [User, RegisterGuarantees],
    migrations: [],
    subscribers: []
});
export const initializeDataSource = async () => {
    try {
        await AppDataSource.initialize();
        console.log('init')
    } catch (err) {
        console.error("initn't", err);

    }
}