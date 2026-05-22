import { chromium } from 'playwright';
import { existsSync, unlinkSync, readFileSync, readdirSync } from 'fs';
import { setTimeout as sleep } from 'timers/promises';
import { createInterface } from 'readline';
import { ensureDataDirs, saveSession, takeScreenshot, saveHtmlSnapshot } from './data-store.mjs';
import { setupNetworkLogging } from './network-interceptor.mjs';

const TRIGGER_FILE = '/tmp/swiftpay-login-done.txt';
const ZOPPIX_URL = 'https://app.zoppix.com.br/';

let rl;

async function waitForTrigger() {
  if (existsSync(TRIGGER_FILE)) unlinkSync(TRIGGER_FILE);

  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log(`  │  🔓 Faça o login manualmente no Chrome que abriu.   │`);
  console.log(`  │  📝 Depois DIGITE no terminal:                      │`);
  console.log(`  │     echo done > ${TRIGGER_FILE}     │`);
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');

  while (true) {
    if (existsSync(TRIGGER_FILE)) {
      const content = readFileSync(TRIGGER_FILE, 'utf8').trim();
      console.log(`\n📥 Login confirmado: "${content}"\n`);
      break;
    }
    await sleep(1000);
  }
  unlinkSync(TRIGGER_FILE);
}

async function main() {
  let exiting = false;
  let browser, context, page;

  console.log('═'.repeat(56));
  console.log('  Swiftpay — Zoppix Reverse Engineering Session');
  console.log('═'.repeat(56));

  const dirs = ensureDataDirs();

  // Launch system Google Chrome
  console.log('\n🌐 Abrindo Google Chrome...');
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--start-maximized'],
    });

    context = await browser.newContext({
      viewport: null,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });

    page = await context.newPage();
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    throw err;
  }

  // Graceful shutdown
  const cleanup = async () => {
    if (exiting) return;
    exiting = true;
    console.log('\n💾 Interrompendo — salvando estado...');
    await saveSession(context, dirs.statePath).catch(() => {});
    await browser.close().catch(() => {});
    if (rl) rl.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Network interception
  const netLog = setupNetworkLogging(page, dirs.apiLogs);

  // Navigate to Zoppix
  console.log(`🔍 Navegando para ${ZOPPIX_URL}`);
  await page.goto(ZOPPIX_URL, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✅ Página carregada');

  // Capture login page
  await takeScreenshot(page, dirs.screenshots, '01-login-page');
  await saveHtmlSnapshot(page, dirs.htmlSnapshots, '01-login-page');

  // Wait for manual login
  await waitForTrigger();

  // Post-login capture
  const url = page.url();
  console.log(`📍 URL atual: ${url}`);
  await takeScreenshot(page, dirs.screenshots, '02-post-login');
  await saveHtmlSnapshot(page, dirs.htmlSnapshots, '02-post-login');

  // Save session
  await saveSession(context, dirs.statePath);

  // Status report
  const logCount = readdirSync(dirs.apiLogs).length;
  console.log('');
  console.log('═'.repeat(56));
  console.log('  ✅ SESSÃO ATIVA — Chrome permanece aberto');
  console.log(`  📊 API calls capturadas: ${logCount}`);
  console.log(`  🔗 URL: ${page.url()}`);
  console.log('  📁 Dados em: tools/playwright/data/');
  console.log('');
  console.log('  📝 Comandos disponíveis no terminal:');
  console.log('     screenshot <nome>  — salvar screenshot da página');
  console.log('     snapshot <nome>    — salvar HTML completo');
  console.log('     stats              — mostrar estatísticas');
  console.log('     exit               — salvar estado e fechar');
  console.log('═'.repeat(56));
  console.log('');

  // Interactive command loop
  rl = createInterface({ input: process.stdin, output: process.stdout });

  rl.on('line', async (line) => {
    try {
      const cmd = line.trim();
      if (!cmd) return;

      if (cmd === 'exit' || cmd === 'quit') {
        if (exiting) return;
        exiting = true;
        console.log('\n💾 Salvando estado final...');
        await saveSession(context, dirs.statePath);
        const total = readdirSync(dirs.apiLogs).length;
        console.log(`📊 Total API calls: ${total}`);
        console.log('🔒 Fechando Chrome...');
        await browser.close();
        rl.close();
        process.exit(0);

    } else if (cmd.startsWith('screenshot ')) {
      const name = cmd.slice(11).trim();
      await takeScreenshot(page, dirs.screenshots, name || `capture-${Date.now()}`);

    } else if (cmd.startsWith('snapshot ')) {
      const name = cmd.slice(9).trim();
      await saveHtmlSnapshot(page, dirs.htmlSnapshots, name || `capture-${Date.now()}`);

    } else if (cmd === 'stats') {
      const logs = readdirSync(dirs.apiLogs).length;
      const screens = readdirSync(dirs.screenshots).length;
      const snaps = readdirSync(dirs.htmlSnapshots).length;
      console.log(`\n  📊 ESTATÍSTICAS`);
      console.log(`  API logs:      ${logs}`);
      console.log(`  Screenshots:   ${screens}`);
      console.log(`  HTML snapshots:${snaps}`);
      console.log(`  URL atual:     ${page.url()}`);

    } else if (cmd) {
      console.log(`  ❓ Comando: "${cmd}" — use: screenshot | snapshot | stats | exit`);
    }
    } catch (err) {
      console.error(`❌ Erro no comando: ${err.message}`);
    }
  });
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err.message);
  if (rl) rl.close();
  process.exit(1);
});
