"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const migrationsDir = path_1.default.join(__dirname, '../../database/migrations');
const runMigrations = async () => {
    console.log('🏁 Starting database migrations...');
    try {
        const files = fs_1.default.readdirSync(migrationsDir).sort();
        for (const file of files) {
            if (file.endsWith('.sql')) {
                const filePath = path_1.default.join(migrationsDir, file);
                console.log(`\n📄 Reading migration file: ${file}`);
                const sql = fs_1.default.readFileSync(filePath, 'utf-8');
                console.log(`⚙️ Executing SQL from ${file}...`);
                await (0, database_1.query)(sql);
                console.log(`✅ Completed migration: ${file}`);
            }
        }
        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error.message || error);
        process.exit(1);
    }
};
runMigrations();
//# sourceMappingURL=runMigrations.js.map