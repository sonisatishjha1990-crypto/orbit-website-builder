'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const EMPTY = { sites: [], domains: [] };

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { sites: parsed.sites || [], domains: parsed.domains || [] };
  } catch (err) {
    return JSON.parse(JSON.stringify(EMPTY));
  }
}

function write(db) {
  ensureDir();
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE); // atomic swap so a crash never leaves a half-written file
  return db;
}

/** Read → mutate → write in one call. */
function mutate(fn) {
  const db = read();
  const result = fn(db);
  write(db);
  return result;
}

module.exports = { read, write, mutate, DB_FILE };
