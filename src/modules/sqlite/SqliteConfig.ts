import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

/**
 * 공통 데이터베이스 인스턴스와 테이블 실행 구문을 관리합니다.
 */
class SqliteConfig {
    private DATABASE_NAME = "tugboat.db";

    constructor() {
        SQLite.enablePromise(true); // Promise 기반 API 활성화
    }

    /**
     * 데이터베이스 인스턴스를 생성하고 이를 반환합니다.
     */
    private async createDBInstance(): Promise<SQLite.SQLiteDatabase> {
        if (Platform.OS === "web") {
            throw new Error("Web platform is not supported");
        }

        try {
            const dbInstance = await SQLite.openDatabase({
                name: this.DATABASE_NAME,
                location: 'default'
            });
            await this.enableForeignKeys(dbInstance);
            await this.enableWAL(dbInstance);
            await this.setBusyTimeout(dbInstance);

            return dbInstance;
        } catch (error) {
            throw new Error(`Failed to open database: ${error}`);
        }
    }

    /**
     * 데이터베이스 인스턴스를 닫아줍니다.
     */
    private async closeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
        try {
            await db.close();
        } catch (error) {
            throw new Error(`Failed to close database: ${error}`);
        }
    }

    /**
     * 외래키 제약조건을 활성화 합니다.
     */
    private async enableForeignKeys(db: SQLite.SQLiteDatabase): Promise<void> {
        try {
            await db.executeSql('PRAGMA foreign_keys = ON;');
        } catch (error) {
            throw new Error(`Failed to enable foreign keys: ${error}`);
        }
    }

    /**
     * WAL 모드를 활성화합니다.
     */
    private async enableWAL(db: SQLite.SQLiteDatabase): Promise<void> {
        try {
            await db.executeSql('PRAGMA journal_mode = WAL;');
        } catch (error) {
            throw new Error(`Failed to enable WAL mode: ${error}`);
        }
    }

    /**
     * 데이터베이스 락 타임아웃을 설정합니다.
     */
    private async setBusyTimeout(db: SQLite.SQLiteDatabase, timeout: number = 5000): Promise<void> {
        try {
            await db.executeSql(`PRAGMA busy_timeout = ${timeout};`);
        } catch (error) {
            throw new Error(`Failed to set busy timeout: ${error}`);
        }
    }

    /**
     * SQL 쿼리를 실행합니다.
     */
    async executeQuery(query: string, params: any[] = []): Promise<any> {
        let dbInstance: SQLite.SQLiteDatabase | null = null;

        try {
            dbInstance = await this.createDBInstance();
            const [results] = await dbInstance.executeSql(query, params);

            // SQLite 결과를 배열로 변환 SQLite.ResultSet
            const rows: SQLite.ResultSet[] = [];
            for (let i = 0; i < results.rows.length; i++) {
                rows.push(results.rows.item(i));
            }

            return rows;
        } catch (error) {
            throw new Error(`Query execution failed: ${error}`);
        } finally {
            if (dbInstance) {
                await this.closeDatabase(dbInstance);
                // console.log("[+] Database connection closed");
            }
        }
    }
}

export default new SqliteConfig();