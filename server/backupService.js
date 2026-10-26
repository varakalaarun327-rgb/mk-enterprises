import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const BACKUPS_DIR = path.resolve(process.env.BACKUPS_DIR || process.env.BACKUP_DIR || path.join(__dirname, 'backups'));

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

console.log(`[Backup Adapter] Active Backup Directory: ${BACKUPS_DIR}`);

/**
 * Prune backups keeping only the latest 30 files
 */
export function pruneOldBackups(maxKeep = 30) {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('mk_backup_') && (f.endsWith('.zip') || f.endsWith('.json')))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return { name: f, path: fullPath, mtime: stats.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep);
      toDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`[Backup Retention] Pruned old backup: ${file.name}`);
        } catch (e) {
          console.error(`Error deleting old backup ${file.name}:`, e);
        }
      });
    }
  } catch (err) {
    console.error('Error during backup pruning:', err);
  }
}

/**
 * Creates a timestamped backup snapshot (.zip or .json fallback)
 */
export async function createDailyBackup(isManual = false) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = `mk_backup_${timestamp}_${isManual ? 'manual' : 'auto'}`;
  const zipPath = path.join(BACKUPS_DIR, `${baseName}.zip`);
  const jsonPath = path.join(BACKUPS_DIR, `${baseName}.json`);

  // Try creating a real zip using native zip command
  return new Promise((resolve) => {
    execFile('zip', ['-j', '-q', zipPath, ...fs.readdirSync(DATA_DIR).map(f => path.join(DATA_DIR, f))], (err) => {
      if (!err && fs.existsSync(zipPath)) {
        const stats = fs.statSync(zipPath);
        console.log(`[Backup] Successfully created ${path.basename(zipPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
        pruneOldBackups(30);
        resolve({
          success: true,
          fileName: path.basename(zipPath),
          filePath: zipPath,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: new Date().toISOString(),
          type: isManual ? 'Manual Backup' : 'Automated Daily (11:59 PM)'
        });
      } else {
        // Fallback to JSON snapshot
        try {
          const snapshot = {};
          const files = fs.readdirSync(DATA_DIR);
          files.forEach(f => {
            if (f.endsWith('.json')) {
              try {
                const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
                snapshot[f.replace('.json', '')] = JSON.parse(content);
              } catch (e) {}
            }
          });
          snapshot._metadata = {
            createdAt: new Date().toISOString(),
            type: isManual ? 'Manual' : 'Automated Daily',
            business: 'M.K. ENTERPRISES'
          };
          fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf-8');
          const stats = fs.statSync(jsonPath);
          console.log(`[Backup] Created JSON snapshot ${path.basename(jsonPath)}`);
          pruneOldBackups(30);
          resolve({
            success: true,
            fileName: path.basename(jsonPath),
            filePath: jsonPath,
            sizeBytes: stats.size,
            sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
            createdAt: new Date().toISOString(),
            type: isManual ? 'Manual Backup' : 'Automated Daily (11:59 PM)'
          });
        } catch (jsonErr) {
          console.error('Backup creation failed:', jsonErr);
          resolve({ success: false, error: jsonErr.message });
        }
      }
    });
  });
}

/**
 * List all available backups
 */
export function listBackups() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    return fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('mk_backup_') && (f.endsWith('.zip') || f.endsWith('.json')))
      .map(fileName => {
        const fullPath = path.join(BACKUPS_DIR, fileName);
        const stats = fs.statSync(fullPath);
        const isManual = fileName.includes('manual');
        return {
          fileName,
          sizeBytes: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          createdAt: stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString(),
          timestamp: stats.mtimeMs,
          type: isManual ? 'Manual Backup' : 'Automated Daily (11:59 PM)',
          extension: path.extname(fileName)
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Error listing backups:', err);
    return [];
  }
}

/**
 * Restore database from snapshot JSON or zip
 */
export function restoreDatabase(dataPayload) {
  // Required keys for validation to prevent corrupt overwrites
  const requiredKeys = ['profile', 'invoices', 'customers', 'inventory'];
  const hasAtLeastOne = requiredKeys.some(k => dataPayload && dataPayload[k]);

  if (!hasAtLeastOne) {
    throw new Error('Invalid backup file. Missing essential database collections (profile, invoices, customers, inventory).');
  }

  // Create emergency rollback backup first
  createDailyBackup(true);

  // Restore collections
  const keys = ['profile', 'invoices', 'customers', 'payments', 'inventory', 'stock_logs', 'auth'];
  let restoredCount = 0;

  keys.forEach(k => {
    if (dataPayload[k]) {
      const targetPath = path.join(DATA_DIR, `${k}.json`);
      fs.writeFileSync(targetPath, JSON.stringify(dataPayload[k], null, 2), 'utf-8');
      restoredCount++;
    }
  });

  return { success: true, collectionsRestored: restoredCount };
}

/**
 * Start Automated Daily Cron (11:59 PM)
 */
export function initializeBackupScheduler() {
  // Daily at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    console.log('[Automated Backup Scheduler] Triggering 11:59 PM Daily Backup...');
    await createDailyBackup(false);
  });
  console.log('[Automated Backup Scheduler] Initialized: Scheduled daily at 11:59 PM (Retention: 30 days).');
}

