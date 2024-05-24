const TelegramBot = require("node-telegram-bot-api");
const mysqldump = require("mysqldump");
const fs = require("fs");
const cron = require("node-cron");
const mysql = require("mysql2/promise");
const keep_alive = require("./keep_alive.js");

// Token bot Telegram Anda
const token = "7031003501:AAHEXv_nSyZ3fwpkMX65VLBcISLhmgzxbZ0";
const chatId = "5436201712"; // Ganti dengan ID chat Anda

// Konfigurasi database
const dbConfig = {
  host: "mix1.dopminer.host",
  port: 3306,
  user: "samp_angkasa_9",
  password: "B7!6Q1Yhj21G",
  database: "samp_angkasa_server",
  connectTimeout: 30000, // Timeout dalam milidetik (contoh: 30 detik)
};

// Inisialisasi koneksi pool
const pool = mysql.createPool(dbConfig);

// Inisialisasi bot Telegram
const bot = new TelegramBot(token, { polling: true });

// Fungsi untuk melakukan backup database
const backupDatabase = async () => {
  const filePath = `./backup_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.sql`;

  try {
    console.log("Mencoba koneksi ke database...");
    // Mendapatkan koneksi dari pool
    const connection = await pool.getConnection();
    const connectionConfig = {
      host: connection.config.host,
      user: connection.config.user,
      password: connection.config.password,
      database: connection.config.database,
      port: connection.config.port,
    };

    await mysqldump({
      connection: connectionConfig,
      dumpToFile: filePath,
    });

    console.log(`Backup berhasil disimpan di ${filePath}`);
    connection.release(); // Melepaskan koneksi kembali ke pool
    return filePath;
  } catch (error) {
    console.error("Error saat melakukan backup database:", error);
    return null;
  }
};

// Fungsi untuk mengirim file ke Telegram
const sendBackupToTelegram = async (filePath) => {
  if (filePath) {
    bot
      .sendDocument(chatId, filePath)
      .then(() => {
        console.log("Backup berhasil dikirim ke Telegram");
        // Hapus file setelah dikirim untuk menghemat ruang
        fs.unlinkSync(filePath);
      })
      .catch((error) => {
        console.error("Error saat mengirim file ke Telegram:", error);
      });
  }
};

// Penjadwalan backup setiap menit
cron.schedule("1 * * * *", async () => {
  console.log("Menjalankan backup database...");
  const filePath = await backupDatabase();
  await sendBackupToTelegram(filePath);
});

console.log("Bot backup database berjalan...");