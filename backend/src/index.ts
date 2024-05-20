import 'reflect-metadata';
import { config } from 'dotenv';
import express from 'express';
import { AppDataSource, initializeDataSource } from './data-source';
import { User } from './models/User';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Job, Queue, Worker } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { RegisterGuarantees } from './models/RegisterGuarantees';
import ExcelJS from 'exceljs';

config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// docker run -d -p 6379:6379 --name redis redis

// Redis connection options
const redisOptions: RedisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
};

// BullMQ Queue
const fileQueue = new Queue('register', {
    connection: redisOptions,
});

app.post('/upload', async (req, res) => {
    const form = new IncomingForm({
        uploadDir: 'src/uploads',
        keepExtensions: true,
        encoding: 'utf-8',
        filename(name, ext, part, form): string {
            return `${Math.floor(Math.random()* (999 - 1) + 1)}_${part.originalFilename}` || '';
        },
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing the files:', err);
            return res.status(400).send('Error parsing the files');
        }

        const fileArray = files.file as FormidableFile[];
        const file = fileArray[0];

        if (!file) {
            console.error('No file received');
            return res.status(400).send('No file received');
        }

        console.log('Uploaded file path:', file.filepath);
        await fileQueue.add('processFile', { filePath: file.filepath });
        res.send('File uploaded and processing started.');
    });
});

// Processor function
const processFile: (job: Job<{ filePath: string }>) => Promise<void> = async (job) => {
    const { filePath } = job.data;
    const ext = path.extname(filePath).slice(1);
    console.log('File extension:', ext);
    if (ext === 'csv') {
        await processCSV2(filePath);
    } else if (ext === 'xlsx') {
        await processXLSX(filePath);
    } else {
        fs.unlinkSync(filePath);
        console.error('Unsupported file type:', ext);
    }
    console.log(`Processed file at path: ${filePath}`);
};

// CSV processing function
const processCSV = (filePath: string): Promise<void> => {
    const results: any[] = [];
    return new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => {
                console.log('CSV row data:', data);
                results.push(data);
            })
            .on('end', async () => {
                try {

                    for (const row of results) {
                        if (!row['username']) {
                            throw new Error("no username")
                        }
                        const user = new User();
                        user.username = row['username'];
                        user.email = row['email'];
                        user.password = row['password'];
                        console.log('Processing row:', row);
                        await AppDataSource.manager.save(user);
                    }
                    fs.unlinkSync(filePath);
                    console.log('File processing completed and file removed:', filePath);
                    resolve();
                } catch (error) {
                    fs.unlinkSync(filePath);
                    console.error('Error processing CSV:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                reject(error);
            });
    });
};

const processCSV2 = (filePath: string): Promise<void> => {
    const results: any[] = [];
    return new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => {
                // console.log('CSV row data:', data);
                results.push(data);
            })
            .on('end', async () => {
                try {

                    for (const row of results) {
                        const guarantee = new RegisterGuarantees();
                        guarantee.nit = row['nit'] ?? '';
                        guarantee.documento_identidad = row['documento_identidad'] ?? '';
                        guarantee.pagare = row['pagare'] ?? '';
                        guarantee.nombres = row['nombres'] ?? '';
                        guarantee.apellidos = row['apellidos'] ?? '';
                        guarantee.monto = row['monto'] ?? '';
                        guarantee.otros = row['otros'] ?? '';
                        guarantee.ciudad_desembolso = row['ciudad_desembolso'] ?? '';
                        guarantee.id_producto = row['id_producto'] ?? '';
                        guarantee.sucursal = row['sucursal'] ?? '';
                        guarantee.sector = row['sector'] ?? '';
                        guarantee.fecha_desembolso = row['fecha_desembolso'] ?? '';
                        guarantee.fecha_terminacion = row['fecha_terminacion'] ?? '';
                        guarantee.tipo_credito = row['tipo_credito'] ?? '';
                        guarantee.score_de_credito = row['score_de_credito'] ?? '';
                        guarantee.fecha_de_nacimiento = row['fecha_de_nacimiento'] ?? '';
                        guarantee.genero = row['genero'] ?? '';
                        guarantee.ocupacion = row['ocupacion'] ?? '';
                        guarantee.perfil_cliente = row['perfil_cliente'] ?? '';
                        guarantee.pagare_anterior = row['pagare_anterior'] ?? '';
                        guarantee.valor_fianza = row['valor_fianza'] ?? '';
                        guarantee.fecha_proceso = row['fecha_proceso'] ?? '';

                        console.log('Processing row:', row);
                        await AppDataSource.manager.save(guarantee);
                    }
                    fs.unlinkSync(filePath);
                    console.log('File processing completed and file removed:', filePath);
                    resolve();
                } catch (error) {
                    fs.unlinkSync(filePath);
                    console.error('Error processing CSV:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error);
                reject(error);
            });
    });
};

const processXLSX = (filePath: string): Promise<void> => {
    const results: any[] = [];
    return new Promise<void>(async (resolve, reject) => {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.worksheets[0];

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const rowData: any = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = worksheet.getRow(1).getCell(colNumber).value as string;
                    rowData[header] = cell.value;
                });
                if (rowNumber !== 1) {
                    results.push(rowData);
                }
            });

            for (const row of results) {
                const guarantee = new RegisterGuarantees();
                guarantee.nit = row['nit'] ?? '';
                guarantee.documento_identidad = row['documento_identidad'] ?? '';
                guarantee.pagare = row['pagare'] ?? '';
                guarantee.nombres = row['nombres'] ?? '';
                guarantee.apellidos = row['apellidos'] ?? '';
                guarantee.monto = row['monto'] ?? '';
                guarantee.otros = row['otros'] ?? '';
                guarantee.ciudad_desembolso = row['ciudad_desembolso'] ?? '';
                guarantee.id_producto = row['id_producto'] ?? '';
                guarantee.sucursal = row['sucursal'] ?? '';
                guarantee.sector = row['sector'] ?? '';
                guarantee.fecha_desembolso = row['fecha_desembolso'] ?? '';
                guarantee.fecha_terminacion = row['fecha_terminacion'] ?? '';
                guarantee.tipo_credito = row['tipo_credito'] ?? '';
                guarantee.score_de_credito = row['score_de_credito'] ?? '';
                guarantee.fecha_de_nacimiento = row['fecha_de_nacimiento'] ?? '';
                guarantee.genero = row['genero'] ?? '';
                guarantee.ocupacion = row['ocupacion'] ?? '';
                guarantee.perfil_cliente = row['perfil_cliente'] ?? '';
                guarantee.pagare_anterior = row['pagare_anterior'] ?? '';
                guarantee.valor_fianza = row['valor_fianza'] ?? '';
                guarantee.fecha_proceso = row['fecha_proceso'] ?? '';

                // console.log('Processing row:', row);
                await AppDataSource.manager.save(guarantee);
            }

            fs.unlinkSync(filePath);
            console.log('File processing completed and file removed:', filePath);
            resolve();
        } catch (error) {
            fs.unlinkSync(filePath);
            console.error('Error processing XLSX:', error);
            reject(error);
        }
    });
};


const startWorker = () => {
    const worker = new Worker('register', processFile, {
        connection: redisOptions,
    });

    worker.on('completed', (job) => {
        console.log(`Job completed with result: ${job.returnvalue}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job failed with error: ${err}`);
    });

    console.log('Worker started and listening for jobs');
};

const startServer = async () => {
    try {
        await initializeDataSource();
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
        startWorker();

    } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
};

startServer();
