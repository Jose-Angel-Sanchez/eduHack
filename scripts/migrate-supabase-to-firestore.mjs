#!/usr/bin/env node
/**
 * Migration Script: Supabase JSON export -> Firestore
 *
 * Usage (after preparing JSON exports):
 *   node scripts/migrate-supabase-to-firestore.mjs exports/ --dry-run
 *
 * Expected directory structure (argument passed as first param):
 *   exports/
 *     courses.json           // [{ id, title, description, difficulty_level, ... }]
 *     profiles.json          // [{ id, email, full_name, username, ... }]
 *     enrollments.json       // [{ id, user_id, course_id, created_at }]
 *     feedback.json          // [{ id, user_id, course_id, rating, feedback_type }]
 *     progress.json          // OPTIONAL future [{ id, user_id, course_id, module_id, percent, updated_at }]
 *
 * To obtain these from Supabase (now removed), use the Supabase dashboard export or psql COPY to CSV then convert to JSON.
 *
 * Firestore write batching: uses 500 document batch size.
 * Dry-run: validates and reports counts without writing.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

const BATCH_LIMIT = 500

function log(msg) { console.log(`[migrate] ${msg}`) }
function err(msg) { console.error(`[migrate:error] ${msg}`) }

async function main() {
  const exportDir = process.argv[2]
  const dryRun = process.argv.includes('--dry-run')
  if (!exportDir) {
    err('Provide export directory path')
    process.exit(1)
  }

  // Initialize Firebase Admin with default credentials (ensure GOOGLE_APPLICATION_CREDENTIALS set)
  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  const files = ['courses.json','profiles.json','enrollments.json','feedback.json','progress.json']
  const loaded = {}
  for (const f of files) {
    const full = path.join(exportDir, f)
    if (!fs.existsSync(full)) { log(`Skip missing ${f}`); continue }
    const raw = fs.readFileSync(full,'utf-8')
    try { loaded[f.replace('.json','')] = JSON.parse(raw) } catch (e) { err(`Failed parsing ${f}: ${e.message}`) }
  }

  log(`Loaded datasets: ${Object.keys(loaded).join(', ')}`)
  if (dryRun) {
    for (const [k,v] of Object.entries(loaded)) log(`${k}: ${v.length} rows ready`)
    log('Dry-run complete (no writes performed).')
    return
  }

  // Helper to batch write
  async function writeCollection(colName, items, mapFn) {
    if (!items || items.length === 0) return
    log(`Writing ${items.length} docs to ${colName}`)
    let batch = db.batch(); let count = 0; let batchCount = 0
    for (const item of items) {
      const mapped = mapFn(item)
      const id = mapped.id || item.id || db.collection(colName).doc().id
      const ref = db.collection(colName).doc(id)
      const { id: _omit, ...rest } = mapped
      batch.set(ref, rest, { merge: true })
      count++; batchCount++
      if (batchCount >= BATCH_LIMIT) { await batch.commit(); log(`Committed batch of ${batchCount}`); batch = db.batch(); batchCount = 0 }
    }
    if (batchCount > 0) { await batch.commit(); log(`Committed final batch of ${batchCount}`) }
    log(`Finished ${colName}: ${count} docs.`)
  }

  await writeCollection('profiles', loaded.profiles, p => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name || '',
    username: p.username || (p.email?.split('@')[0] || ''),
    createdAt: p.created_at || new Date().toISOString(),
    migratedFrom: 'supabase'
  }))

  await writeCollection('courses', loaded.courses, c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    difficulty_level: c.difficulty_level,
    category: c.category || 'general',
    estimated_duration: c.estimated_duration || 0,
    createdAt: c.created_at || new Date().toISOString(),
    migratedFrom: 'supabase'
  }))

  await writeCollection('enrollments', loaded.enrollments, e => ({
    id: e.id,
    userId: e.user_id,
    courseId: e.course_id,
    createdAt: e.created_at || new Date().toISOString(),
    migratedFrom: 'supabase'
  }))

  await writeCollection('feedback', loaded.feedback, f => ({
    id: f.id,
    userId: f.user_id,
    courseId: f.course_id,
    rating: f.rating || 0,
    feedbackType: f.feedback_type || 'course',
    createdAt: f.created_at || new Date().toISOString(),
    migratedFrom: 'supabase'
  }))

  await writeCollection('progress', loaded.progress, p => ({
    id: p.id,
    userId: p.user_id,
    courseId: p.course_id,
    moduleId: p.module_id,
    percent: p.percent || 0,
    updatedAt: p.updated_at || new Date().toISOString(),
    migratedFrom: 'supabase'
  }))

  log('Migration complete.')
}

main().catch(e => { err(e.stack || e.message); process.exit(1) })
