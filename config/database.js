/**
 * Configuración de Base de Datos - Multi-Platform
 * Sistema de Gestión Dental - Clínica Rubio García
 * 
 * Soporta SQL Server (local) y PostgreSQL (cloud/Render.com)
 */

require('dotenv').config();

class DatabaseConfig {
    constructor() {
        this.dbType = this.detectDatabaseType();
        this.config = this.getConfig();
        this.pool = null;
        this.isConnected = false;
        this.client = null;
    }

    /**
     * Detectar tipo de base de datos según variables de entorno
     */
    detectDatabaseType() {
        // Si es Render.com o cloud, usar PostgreSQL
        if (process.env.DATABASE_URL || process.env.PGHOST || process.env.DB_TYPE === 'postgres') {
            return 'postgres';
        }
        // Si tiene variables de SQL Server, usar SQL Server
        if (process.env.DB_SERVER || process.env.DB_TYPE === 'sqlserver') {
            return 'sqlserver';
        }
        // Por defecto SQL Server
        return 'sqlserver';
    }

    /**
     * Obtener configuración según el tipo de base de datos
     */
    getConfig() {
        switch (this.dbType) {
            case 'postgres':
                return this.getPostgreSQLConfig();
            case 'sqlserver':
                return this.getSQLServerConfig();
            default:
                throw new Error(`Tipo de base de datos no soportado: ${this.dbType}`);
        }
    }

    /**
     * Configuración para PostgreSQL (Render.com, cloud)
     */
    getPostgreSQLConfig() {
        // Render.com proporciona DATABASE_URL
        if (process.env.DATABASE_URL) {
            const { Pool } = require('pg');
            return {
                client: 'pg',
                pool: new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 2000,
                }),
                config: {
                    user: process.env.DB_USER,
                    host: process.env.DB_SERVER,
                    database: process.env.DB_DATABASE,
                    password: process.env.DB_PASSWORD,
                    port: process.env.DB_PORT || 5432,
                    ssl: process.env.NODE_ENV === 'production'
                }
            };
        }

        // Configuración manual de PostgreSQL
        const { Pool } = require('pg');
        return {
            client: 'pg',
            pool: new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_SERVER,
                database: process.env.DB_DATABASE,
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT || 5432,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            }),
            config: {
                user: process.env.DB_USER,
                host: process.env.DB_SERVER,
                database: process.env.DB_DATABASE,
                password: process.env.DB_PASSWORD,
                port: process.env.DB_PORT || 5432,
                ssl: process.env.NODE_ENV === 'production'
            }
        };
    }

    /**
     * Configuración para SQL Server (local/desarrollo)
     */
    getSQLServerConfig() {
        const sql = require('mssql');
        return {
            client: 'mssql',
            pool: null, // Se inicializará cuando sea necesario
            config: {
                server: process.env.DB_SERVER || 'localhost',
                database: process.env.DB_DATABASE || 'DentalClinicDB',
                user: process.env.DB_USER || 'sa',
                password: process.env.DB_PASSWORD || '',
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                },
                options: {
                    encrypt: process.env.DB_ENCRYPT === 'true',
                    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
                    enableArithAbort: true,
                    useUTC: false
                },
                requestTimeout: 60000,
                connectionTimeout: 60000
            }
        };
    }

    /**
     * Crear pool de conexiones
     */
    async createPool() {
        try {
            if (this.dbType === 'postgres') {
                // PostgreSQL ya está configurado
                this.pool = this.config.pool;
                this.client = require('pg');
                this.isConnected = true;
                console.log('✅ Conectado a PostgreSQL:', process.env.DB_SERVER || 'Render.com');
            } else if (this.dbType === 'sqlserver') {
                // SQL Server necesita inicialización
                const sql = require('mssql');
                this.pool = await sql.connect(this.config.config);
                this.client = sql;
                this.isConnected = true;
                console.log('✅ Conectado a SQL Server:', process.env.DB_SERVER);
            }

            // Configurar event listeners
            if (this.dbType === 'postgres') {
                this.pool.on('error', (err) => {
                    console.error('❌ Error en pool PostgreSQL:', err);
                    this.isConnected = false;
                });
            } else if (this.dbType === 'sqlserver') {
                this.pool.on('error', (err) => {
                    console.error('❌ Error en pool SQL Server:', err);
                    this.isConnected = false;
                });
            }

            return this.pool;
        } catch (error) {
            console.error(`❌ Error conectando a ${this.dbType}:`, error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Obtener pool de conexiones
     */
    async getPool() {
        if (!this.pool || !this.isConnected) {
            await this.createPool();
        }
        return this.pool;
    }

    /**
     * Ejecutar consulta según el tipo de base de datos
     */
    async query(queryString, parameters = []) {
        try {
            const pool = await this.getPool();

            if (this.dbType === 'postgres') {
                return await this.executePostgreSQLQuery(pool, queryString, parameters);
            } else if (this.dbType === 'sqlserver') {
                return await this.executeSQLServerQuery(pool, queryString, parameters);
            }
        } catch (error) {
            console.error('❌ Error ejecutando consulta:', error);
            throw error;
        }
    }

    /**
     * Ejecutar consulta PostgreSQL
     */
    async executePostgreSQLQuery(pool, queryString, parameters) {
        // Convertir parámetros de SQL Server a PostgreSQL
        const pgQuery = this.convertQueryToPostgreSQL(queryString, parameters);
        const result = await pool.query(pgQuery.query, pgQuery.values);
        return { recordset: result.rows, rowsAffected: result.rowCount };
    }

    /**
     * Ejecutar consulta SQL Server
     */
    async executeSQLServerQuery(pool, queryString, parameters) {
        const request = pool.request();

        // Agregar parámetros si existen
        parameters.forEach((param, index) => {
            if (param.name && param.value !== undefined) {
                request.input(param.name, param.value);
            } else {
                request.input(`param${index}`, param);
            }
        });

        const result = await request.query(queryString);
        return result;
    }

    /**
     * Convertir consultas de SQL Server a PostgreSQL
     */
    convertQueryToPostgreSQL(queryString, parameters) {
        let pgQuery = queryString;

        // Conversiones básicas de sintaxis
        pgQuery = pgQuery.replace(/GETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
        pgQuery = pgQuery.replace(/SCOPE_IDENTITY\(\)/gi, 'RETURNING id');
        pgQuery = pgQuery.replace(/TOP\s+\d+/gi, ''); // PostgreSQL usa LIMIT

        // Convertir nombres de tablas a minúsculas
        pgQuery = pgQuery.replace(/FROM\s+([A-Z][A-Za-z0-9_]+)/gi, (match, table) => {
            return `FROM ${table.toLowerCase()}`;
        });

        // Convertir valores de parámetros
        const values = parameters.map(param => {
            if (param.value !== undefined) {
                return param.value;
            }
            return param;
        });

        return { query: pgQuery, values };
    }

    /**
     * Ejecutar transacción
     */
    async transaction(callback) {
        const pool = await this.getPool();

        if (this.dbType === 'postgres') {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const result = await callback({
                    query: (text, params) => client.query(text, params)
                });
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('❌ Error en transacción PostgreSQL:', error);
                throw error;
            } finally {
                client.release();
            }
        } else if (this.dbType === 'sqlserver') {
            const sql = require('mssql');
            const transaction = new sql.Transaction(pool);
            
            try {
                await transaction.begin();
                const request = new sql.Request(transaction);
                const result = await callback(request);
                await transaction.commit();
                return result;
            } catch (error) {
                await transaction.rollback();
                console.error('❌ Error en transacción SQL Server:', error);
                throw error;
            }
        }
    }

    /**
     * Verificar conexión
     */
    async testConnection() {
        try {
            if (this.dbType === 'postgres') {
                const result = await this.query('SELECT 1 as test');
                console.log('✅ Prueba de conexión PostgreSQL exitosa');
            } else {
                const result = await this.query('SELECT 1 as test');
                console.log('✅ Prueba de conexión SQL Server exitosa');
            }
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de conexión:', error);
            return false;
        }
    }

    /**
     * Cerrar pool de conexiones
     */
    async closePool() {
        if (this.pool) {
            if (this.dbType === 'postgres') {
                await this.pool.end();
            } else if (this.dbType === 'sqlserver') {
                await this.pool.close();
            }
            this.pool = null;
            this.isConnected = false;
            console.log(`🔌 Pool de conexiones ${this.dbType} cerrado`);
        }
    }

    /**
     * Obtener estado de conexión
     */
    getConnectionStatus() {
        return {
            dbType: this.dbType,
            isConnected: this.isConnected,
            server: this.config.config.host || this.config.config.server,
            database: this.config.config.database,
            pool: this.pool ? {
                totalCount: this.pool.totalCount || 'N/A',
                idleCount: this.pool.idleCount || 'N/A',
                waitingCount: this.pool.waitingCount || 'N/A'
            } : null
        };
    }

    /**
     * Obtener configuración de base de datos específica
     */
    getDatabaseConfig() {
        return this.config.config;
    }

    /**
     * Obtener queries adaptadas al tipo de base de datos
     */
    getAdaptedQueries() {
        if (this.dbType === 'postgres') {
            return this.getPostgreSQLQueries();
        } else {
            return this.getSQLServerQueries();
        }
    }

    /**
     * Queries adaptadas para PostgreSQL
     */
    getPostgreSQLQueries() {
        return {
            // Citas
            GET_APPOINTMENTS: `
                SELECT 
                    a.*,
                    p.firstname,
                    p.lastname,
                    p.phone,
                    p.email,
                    p.dateofbirth
                FROM dcitas a
                LEFT JOIN dpatients p ON a.patientid = p.patientid
                WHERE ($1::date IS NULL OR a.appointmentdate = $1::date)
                AND ($2::integer IS NULL OR a.idsitc = $2)
                ORDER BY a.appointmentdate DESC, a.appointmenttime ASC
            `,
            
            CREATE_APPOINTMENT: `
                INSERT INTO dcitas (
                    patientid, appointmentdate, appointmenttime, duration, 
                    idic, texto, idus, idsitc, notas
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING citaid
            `,

            GET_PATIENTS: `
                SELECT * FROM dpatients
                WHERE ($1::text IS NULL OR firstname ILIKE '%' || $1 || '%' 
                    OR lastname ILIKE '%' || $1 || '%' 
                    OR phone ILIKE '%' || $1 || '%')
                ORDER BY lastname, firstname
            `
        };
    }

    /**
     * Queries para SQL Server (ya están en el archivo original)
     */
    getSQLServerQueries() {
        return require('./sql-queries');
    }
}

// Crear instancia singleton
const dbConfig = new DatabaseConfig();

// Queries originales para SQL Server (mantener compatibilidad)
const SQL_QUERIES = {
    // Se mantendrán las queries originales aquí
    // Se pueden migrar gradualmente al nuevo sistema
};

module.exports = {
    dbConfig,
    SQL_QUERIES
};