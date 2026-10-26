#!/usr/bin/env node

/**
 * M.K. ENTERPRISES - Standalone Database Backup Script
 * Can be executed manually or triggered via Linux cron / Windows Task Scheduler.
 * 
 * Usage:
 *   node scripts/backup.js [optional_target_directory]
 * 
 * Examples:
 *   node scripts/backup.js
 *   node scripts/backup.js /media/usb/mk_backups
 *   node scripts/backup.js ~/GoogleDrive/MK_Enterprises_Backups
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT_DIR, 'server', 'data'));
const DEFAULT_BACKUP_DIR = path.resolve(process.env.BACKUPS_DIR || process.env.BACKUP_DIR || path.join(ROOT_DIR, 'server', 'backups'));

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BACKUP_DIR;

console.log('====================================================');
console.log('M.K. ENTERPRISES - Glass & Aluminium Billing System');
console.log('Automated Database Backup Routine');
console.log('====================================================');
console.log(`Source Directory: ${DATA_DIR}`);
console.log(`Target Backup Directory: ${targetDir}`);

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Error: Source data directory does not exist: ${DATA_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupZipName = `mk_backup_${timestamp}_cron.zip`;
const backupJsonName = `mk_backup_${timestamp}_cron.json`;
const zipPath = path.join(targetDir, backupZipName);
const jsonPath = path.join(targetDir, backupJsonName);

let backupCreated = false;
let finalFilePath = '';

// Attempt native zip first
try {
  const dataFiles = fs.readdirSync(DATA_DIR).map(f => path.join(DATA_DIR, f));
  execFileSync('zip', ['-j', '-q', zipPath, ...dataFiles]);
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    console.log(`✓ Zip Backup created successfully: ${backupZipName} (${(stats.size / 1024).toFixed(1)} KB)`);
    backupCreated = true;
    finalFilePath = zipPath;
  }
} catch (zipErr) {
  // Fallback to unified JSON snapshot
  console.log('Zip utility not available or failed. Generating structured JSON snapshot...');
}

if (!backupCreated) {
  try {
    const snapshot = {};
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(f => {
      if (f.endsWith('.json')) {
        const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
        snapshot[f.replace('.json', '')] = JSON.parse(content);
      }
    });
    snapshot._backupMeta = {
      timestamp: new Date().toISOString(),
      triggeredBy: 'Standalone Cron Script',
      business: 'M.K. ENTERPRISES - Pargi'
    };
    fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    const stats = fs.statSync(jsonPath);
    console.log(`✓ JSON Snapshot created successfully: ${backupJsonName} (${(stats.size / 1024).toFixed(1)} KB)`);
    backupCreated = true;
    finalFilePath = jsonPath;
  } catch (err) {
    console.error('Fatal: Failed to create database backup:', err);
    process.exit(1);
  }
}

// Prune older backups keeping last 30
try {
  const allBackups = fs.readdirSync(targetDir)
    .filter(f => f.startsWith('mk_backup_') && (f.endsWith('.zip') || f.endsWith('.json')))
    .map(f => {
      const full = path.join(targetDir, f);
      return { name: f, path: full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (allBackups.length > 30) {
    const toDelete = allBackups.slice(30);
    toDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        console.log(`Deleted archived backup past 30-day retention: ${file.name}`);
      } catch (e) {}
    });
  }
  console.log(`Total active backups retained in target folder: ${Math.min(allBackups.length, 30)}`);
} catch (e) {
  console.error('Retention pruning note:', e.message);
}

console.log('====================================================');
console.log('Backup Routine Completed Successfully.');
console.log(`Destination: ${finalFilePath}`);
console.log('====================================================');

