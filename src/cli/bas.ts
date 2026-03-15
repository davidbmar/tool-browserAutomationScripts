import { Command } from 'commander';
import { listProfiles } from '../core/profiles';
import { getCookies } from '../core/cookies';
import { launchProfile } from '../core/launcher';

const program = new Command();

program
  .name('bas')
  .description('Browser Automation Scripts — Chrome profile launcher and cookie tool')
  .version('0.1.0');

program
  .command('profiles')
  .description('List available Chrome profiles')
  .action(() => {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      console.log('No Chrome profiles found.');
      return;
    }

    // Table header
    console.log(
      'Directory'.padEnd(20) +
      'Name'.padEnd(30) +
      'Path'
    );
    console.log('-'.repeat(80));

    for (const p of profiles) {
      console.log(
        p.directory.padEnd(20) +
        p.name.padEnd(30) +
        p.path
      );
    }
  });

program
  .command('cookies <domain>')
  .description('Decrypt and display cookies for a domain')
  .option('-p, --profile <dir>', 'Chrome profile directory', 'Default')
  .option('-f, --format <fmt>', 'Output format: table or json', 'table')
  .action((domain: string, opts: { profile: string; format: string }) => {
    const cookies = getCookies(domain, opts.profile);

    if (cookies.length === 0) {
      console.log(`No cookies found for domain "${domain}".`);
      return;
    }

    if (opts.format === 'json') {
      console.log(JSON.stringify(cookies, null, 2));
    } else {
      // Table format
      console.log(
        'Name'.padEnd(30) +
        'Domain'.padEnd(30) +
        'Value'
      );
      console.log('-'.repeat(90));

      for (const c of cookies) {
        const truncatedValue = c.value.length > 40
          ? c.value.substring(0, 37) + '...'
          : c.value;
        console.log(
          c.name.padEnd(30) +
          c.domain.padEnd(30) +
          truncatedValue
        );
      }

      console.log(`\n${cookies.length} cookie(s) found.`);
    }
  });

program
  .command('launch <profile>')
  .description('Open Chrome with the specified profile')
  .option('-u, --url <url>', 'URL to open')
  .action((profile: string, opts: { url?: string }) => {
    console.log(`Launching Chrome with profile "${profile}"...`);
    const pid = launchProfile(profile, { url: opts.url });
    if (pid) {
      console.log(`Chrome started (PID: ${pid})`);
    } else {
      console.log('Chrome launched (detached)');
    }
  });

program.parse(process.argv);
