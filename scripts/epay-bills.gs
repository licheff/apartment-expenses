/**
 * ePay.bg Bill Parser — Google Apps Script
 *
 * Runs daily. Searches Gmail for unprocessed ePay.bg notification emails,
 * extracts merchant name + EUR amount, and inserts into Supabase `bills` table.
 * The DB trigger `sync_bill_to_expense()` handles the rest.
 *
 * Setup:
 *   1. Create a new Google Apps Script project at script.google.com
 *   2. Paste this file as Code.gs
 *   3. Set Script Properties (Project Settings → Script Properties):
 *      - SUPABASE_URL      → your Supabase project URL
 *      - SUPABASE_SERVICE_KEY → service_role key (bypasses RLS)
 *   4. Run setupDailyTrigger() once to create the daily 9am trigger
 *   5. Run testManual() to process any existing emails
 */

const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
const SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function processEpayBills() {
  const threads = GmailApp.search('from:ntf@epay.bg subject:"Чакащи задължения в ePay.bg" -label:BillsProcessed');

  if (threads.length === 0) {
    Logger.log('No new ePay emails found');
    return;
  }

  const providers = fetchProviders();
  const label = getOrCreateLabel('BillsProcessed');

  let processed = 0;
  let skipped = 0;

  for (const thread of threads) {
    const messages = thread.getMessages();

    for (const message of messages) {
      try {
        const result = parseEpayEmail(message, providers);
        if (result) {
          insertBill(result);
          processed++;
          Logger.log(`✓ ${result.providerName} — ${result.amount} EUR (${result.billDate})`);
        } else {
          skipped++;
        }
      } catch (e) {
        Logger.log(`✗ Error on message ${message.getId()}: ${e.message}`);
      }
    }

    label.addToThread(thread);
  }

  Logger.log(`Done. Processed: ${processed}, Skipped: ${skipped}, Threads: ${threads.length}`);
}

// ---------------------------------------------------------------------------
// Email parsing
// ---------------------------------------------------------------------------

function parseEpayEmail(message, providers) {
  const body = message.getPlainBody();
  const messageId = message.getId();
  const date = message.getDate();

  // Find the data line after the "---" separator
  const lines = body.split('\n');
  let dataLine = null;
  let foundSeparator = false;

  for (const line of lines) {
    if (line.match(/^-{5,}/)) {
      foundSeparator = true;
      continue;
    }
    if (foundSeparator && line.trim()) {
      dataLine = line.trim();
      break;
    }
  }

  if (!dataLine) {
    Logger.log('No data line found after separator in: ' + messageId);
    return null;
  }

  // Extract EUR amount (e.g. "11.35 EUR" or "183.37 EUR")
  const amountMatch = dataLine.match(/(\d+[\.,]\d{2})\s*EUR/);
  if (!amountMatch) {
    Logger.log('No EUR amount found in: ' + dataLine);
    return null;
  }
  const amount = parseFloat(amountMatch[1].replace(',', '.'));

  // Match merchant against known providers
  const provider = providers.find(p => dataLine.includes(p.epay_merchant));
  if (!provider) {
    Logger.log('Unknown merchant in: ' + dataLine);
    return null;
  }

  return {
    providerId: provider.id,
    providerName: provider.name,
    amount: amount,
    billDate: Utilities.formatDate(date, 'Europe/Sofia', 'yyyy-MM-dd'),
    gmailMessageId: messageId,
  };
}

// ---------------------------------------------------------------------------
// Supabase API
// ---------------------------------------------------------------------------

function fetchProviders() {
  const url = `${SUPABASE_URL}/rest/v1/providers?is_active=eq.true&select=id,name,epay_merchant`;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return JSON.parse(response.getContentText());
}

function insertBill(data) {
  // on_conflict=gmail_message_id prevents duplicates if the label wasn't applied
  const url = `${SUPABASE_URL}/rest/v1/bills?on_conflict=gmail_message_id`;
  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates',
    },
    payload: JSON.stringify({
      provider_id: data.providerId,
      amount: data.amount,
      bill_date: data.billDate,
      gmail_message_id: data.gmailMessageId,
    }),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() >= 400) {
    throw new Error(`Supabase insert failed (${response.getResponseCode()}): ${response.getContentText()}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOrCreateLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}

// ---------------------------------------------------------------------------
// Setup & Testing
// ---------------------------------------------------------------------------

/** Run once to create the daily trigger */
function setupDailyTrigger() {
  // Clear existing triggers for this function
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processEpayBills')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('processEpayBills')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('Europe/Sofia')
    .create();

  Logger.log('Daily trigger set for 9am Sofia time');
}

/** Process all unprocessed emails now (for testing) */
function testManual() {
  processEpayBills();
}
