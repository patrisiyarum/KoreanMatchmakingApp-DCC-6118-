import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import { fileURLToPath, pathToFileURL } from "url";

// set paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENV
const env = process.env.NODE_ENV || "development";

// load config from src/config
const configPath = path.resolve(__dirname, "../src/config/config.json");
const configFile = JSON.parse(fs.readFileSync(configPath, "utf8"));
const config = configFile[env];

const db = {};

// init sequelize
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

const modelsDir = path.resolve(__dirname, "../src/models");

const modelFiles = fs
  .readdirSync(modelsDir)
  .filter(
    (file) =>
      file.endsWith(".js") &&
      !file.startsWith(".") &&
      file !== "index.js"
  );

for (const file of modelFiles) {
  const modulePath = pathToFileURL(path.join(modelsDir, file));
  const modelModule = await import(modulePath);
  const model = modelModule.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// run associations
Object.values(db).forEach((model) => {
  if (model.associate) model.associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;


export default db;
