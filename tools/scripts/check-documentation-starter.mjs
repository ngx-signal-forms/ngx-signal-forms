import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { documentationStarter } from '../../packages/toolkit/scripts/documentation-starter.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const readme = await readFile(join(root, 'README.md'), 'utf8');
const source = documentationStarter(readme);
await mkdir(join(root, 'tmp'), { recursive: true });
const scratch = await mkdtemp(join(root, 'tmp/documentation-starter-'));

try {
  await mkdir(join(scratch, 'node_modules/@ngx-signal-forms'), {
    recursive: true,
  });
  await symlink(
    join(root, 'dist/packages/toolkit'),
    join(scratch, 'node_modules/@ngx-signal-forms/toolkit'),
    'dir',
  );
  await writeFile(join(scratch, 'package.json'), '{"type":"module"}\n');
  await writeFile(join(scratch, 'contact.ts'), source);
  await writeFile(
    join(scratch, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        strict: true,
        skipLibCheck: true,
        experimentalDecorators: true,
        outDir: './out',
        types: [],
      },
      angularCompilerOptions: {
        strictTemplates: true,
        compilationMode: 'full',
      },
      files: ['./contact.ts'],
    }),
  );
  const compilerRoot = dirname(
    require.resolve('@angular/compiler-cli/package.json'),
  );
  execFileSync(
    process.execPath,
    [
      join(compilerRoot, 'bundles/src/bin/ngc.js'),
      '-p',
      join(scratch, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );

  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
  });
  for (const key of [
    'window',
    'document',
    'Node',
    'HTMLElement',
    'Element',
    'Event',
  ]) {
    Object.defineProperty(globalThis, key, {
      value: dom.window[key],
      configurable: true,
    });
  }
  await import('@angular/compiler');
  const { TestBed } = await import('@angular/core/testing');
  const { BrowserTestingModule, platformBrowserTesting } =
    await import('@angular/platform-browser/testing');
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
  const { ContactComponent } = await import(
    pathToFileURL(join(scratch, 'out/contact.js')).href
  );
  const fixture = TestBed.createComponent(ContactComponent);
  try {
    fixture.detectChanges();
    const formElement = fixture.nativeElement.querySelector('form');
    const input = fixture.nativeElement.querySelector('input');
    formElement.dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    assert.equal(fixture.componentInstance.savedEmail(), '');
    assert.equal(fixture.componentInstance.contactForm.email().touched(), true);
    input.value = 'reader@example.com';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    fixture.detectChanges();
    formElement.dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    assert.equal(fixture.componentInstance.savedEmail(), 'reader@example.com');
    assert.match(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
      /Saved: reader@example.com/,
    );
    console.log(
      'Starter: strict Angular compilation and invalid/valid DOM submission passed.',
    );
  } finally {
    fixture.destroy();
    TestBed.resetTestingModule();
    dom.window.close();
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
