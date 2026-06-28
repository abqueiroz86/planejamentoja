const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\abque\\.gemini\\antigravity-ide\\brain\\0549a2e4-37c6-418a-817d-f9e78a77dc25\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('capture_browser_console_logs')) {
      // Find the console log output blocks
      const obj = JSON.parse(line);
      console.log('--- STEP ---');
      console.log('Type:', obj.type);
      console.log('Status:', obj.status);
      if (obj.content) {
        console.log('Content snippet:', obj.content.slice(0, 1000));
      }
    }
  }
}

run();
