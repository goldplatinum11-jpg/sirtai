#!/usr/bin/env node
// sirt — SIRT.ai CLI
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.sirt');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return null; }
}

function saveConfig(config) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

function fetch(baseUrl, apiKey, urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + urlPath);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      rejectUnauthorized: false
    };
    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Commands ───

async function cmdInit() {
  console.log('SIRT.ai Setup\n');

  let server = await ask('Server URL [https://163.44.110.103/brain]: ');
  if (!server) server = 'https://163.44.110.103/brain';
  server = server.replace(/\/$/, '');

  // Test connection
  try {
    const stats = await fetch(server, 'test', '/stats');
    if (stats.total === undefined) throw new Error('invalid response');
    console.log(`Connected: ${stats.total} nodes, schema ${stats.schema_version}\n`);
  } catch (e) {
    console.error('Cannot connect to', server);
    console.error(e.message);
    process.exit(1);
  }

  const choice = await ask('(1) Register new account  (2) Login  (3) Use API key: ');

  let apiKey, userId, tenantId;

  if (choice === '1') {
    const email = await ask('Email: ');
    const password = await ask('Password (min 8 chars): ');
    const name = await ask('Display name (optional): ');
    const result = await fetch(server, 'none', '/auth/register', 'POST', { email, password, display_name: name || undefined });
    if (result.error) { console.error('Error:', result.error); process.exit(1); }
    apiKey = result.api_key;
    userId = result.user_id;
    tenantId = result.tenant_id;
    console.log('\nRegistered!');
    console.log('API Key:', apiKey);
    console.log('Save this key — it cannot be recovered.\n');
  } else if (choice === '2') {
    const email = await ask('Email: ');
    const password = await ask('Password: ');
    const result = await fetch(server, 'none', '/auth/login', 'POST', { email, password });
    if (result.error) { console.error('Error:', result.error); process.exit(1); }
    apiKey = result.api_key;
    userId = result.user_id;
    tenantId = result.tenant_id;
    console.log('\nLogged in!');
  } else {
    apiKey = await ask('API Key: ');
  }

  saveConfig({ server, api_key: apiKey, user_id: userId, tenant_id: tenantId });
  console.log(`Config saved to ${CONFIG_FILE}`);
  console.log('Run `sirt stats` to verify.');
}

async function cmdStats(config) {
  const r = await fetch(config.server, config.api_key, '/stats');
  console.log('Nodes:', r.total);
  console.log('Events:', r.events);
  console.log('Graph links:', r.graph_links);
  console.log('Storage:', r.storage);
  console.log('Schema:', r.schema_version);
  console.log('Confidence:', r.avg_confidence);
}

async function cmdSearch(config, query) {
  if (!query) { console.error('Usage: sirt search <query>'); return; }
  const r = await fetch(config.server, config.api_key, '/search?q=' + encodeURIComponent(query));
  if (r.results) {
    for (const n of r.results.slice(0, 15)) {
      const type = n.type ? `[${n.type}]` : '';
      console.log(`  ${n.id} ${type} ${n.summary || '(no summary)'}`);
    }
    console.log(`\n${r.results.length} results`);
  } else {
    console.log(r);
  }
}

async function cmdSemantic(config, query) {
  if (!query) { console.error('Usage: sirt semantic <query>'); return; }
  const r = await fetch(config.server, config.api_key, '/semantic/semantic_search?q=' + encodeURIComponent(query) + '&n=10');
  if (r.results) {
    for (const n of r.results) {
      const sim = (n.similarity * 100).toFixed(1);
      const temp = n.temperature ? ` (${n.temperature})` : '';
      console.log(`  ${sim}% ${n.id} [${n.type}] ${n.summary}${temp}`);
    }
    console.log(`\n${r.count} results`);
  } else {
    console.log(r);
  }
}

async function cmdGet(config, id) {
  if (!id) { console.error('Usage: sirt get <node-id>'); return; }
  const r = await fetch(config.server, config.api_key, '/nodes/' + encodeURIComponent(id));
  if (r.error) { console.error('Error:', r.error); return; }
  console.log(JSON.stringify(r, null, 2));
}

async function cmdSave(config, id) {
  if (!id) { console.error('Usage: sirt save <node-id> [reads from stdin]'); return; }
  // Read JSON from stdin
  let input = '';
  if (!process.stdin.isTTY) {
    for await (const chunk of process.stdin) input += chunk;
  } else {
    const summary = await ask('Summary: ');
    const type = await ask('Type [reference]: ') || 'reference';
    const body = await ask('Body: ');
    const tags = await ask('Tags (comma-separated): ');
    input = JSON.stringify({
      id, content: { type, summary, body },
      confidence: 0.8,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });
  }
  const node = JSON.parse(input);
  if (!node.id) node.id = id;
  const r = await fetch(config.server, config.api_key, '/nodes/' + encodeURIComponent(id), 'PUT', node);
  console.log(r.status === 'created' ? 'Created:' : 'Updated:', r.id, 'v' + r.version);
}

async function cmdUnlock(config, passphrase) {
  const p = passphrase || await ask('Passphrase: ');
  const r = await fetch(config.server, config.api_key, '/e2e/unlock', 'POST', { passphrase: p });
  if (r.status === 'unlocked') console.log('Unlocked. Key:', r.key_id);
  else console.error('Failed:', r.error || r);
}

async function cmdLock(config) {
  const r = await fetch(config.server, config.api_key, '/e2e/lock', 'POST', {});
  console.log(r.status === 'locked' ? 'Locked.' : r);
}

async function cmdStatus(config) {
  const r = await fetch(config.server, config.api_key, '/e2e/status');
  console.log('E2E:', r.initialized ? (r.unlocked ? 'UNLOCKED' : 'LOCKED') : 'NOT INITIALIZED');
  if (r.key_id) console.log('Key:', r.key_id);
  if (r.nodes_encrypted !== undefined) console.log('Encrypted:', r.nodes_encrypted, '/', r.nodes_encrypted + r.nodes_plaintext);
}

async function cmdMe(config) {
  const r = await fetch(config.server, config.api_key, '/auth/me');
  if (r.error) { console.error(r.error); return; }
  if (r.email) {
    console.log('Email:', r.email);
    console.log('User:', r.id);
    console.log('Tenant:', r.tenant_id);
    console.log('Nodes:', r.nodes);
    console.log('Role:', r.role);
  } else {
    console.log('Admin (master key)');
    console.log('Tenant:', r.tenant_id);
  }
}

async function cmdBootstrap(config, trigger) {
  const url = '/session-bootstrap' + (trigger ? '?trigger=' + encodeURIComponent(trigger) : '');
  const r = await fetch(config.server, config.api_key, url);
  console.log(JSON.stringify(r, null, 2));
}

// ─── Main ───

const [cmd, ...args] = process.argv.slice(2);
const arg = args.join(' ');

if (cmd === 'init') {
  cmdInit();
} else if (cmd === 'help' || !cmd) {
  console.log(`sirt — SIRT.ai CLI v0.1.0

Commands:
  init                  Setup connection & account
  stats                 Brain statistics
  search <query>        Keyword search
  semantic <query>      Semantic (meaning) search
  get <node-id>         Get a node
  save <node-id>        Save/update a node (interactive or stdin)
  bootstrap [trigger]   Session bootstrap context
  unlock [passphrase]   Unlock E2E encryption
  lock                  Lock E2E encryption
  status                E2E encryption status
  me                    Current user info

Config: ~/.sirt/config.json`);
} else {
  const config = loadConfig();
  if (!config) {
    console.error('Not configured. Run: sirt init');
    process.exit(1);
  }
  switch (cmd) {
    case 'stats': cmdStats(config); break;
    case 'search': cmdSearch(config, arg); break;
    case 'semantic': cmdSemantic(config, arg); break;
    case 'get': cmdGet(config, args[0]); break;
    case 'save': cmdSave(config, args[0]); break;
    case 'unlock': cmdUnlock(config, args[0]); break;
    case 'lock': cmdLock(config); break;
    case 'status': cmdStatus(config); break;
    case 'me': cmdMe(config); break;
    case 'bootstrap': cmdBootstrap(config, args[0]); break;
    default: console.error('Unknown command:', cmd, '\nRun: sirt help');
  }
}
