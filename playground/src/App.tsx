import {useEffect, useRef, useState} from 'react';
import {WebContainer} from '@webcontainer/api';
import {Terminal} from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import './App.css';

let webContainerPromise: Promise<WebContainer> | undefined;
let sandboxReadyPromise: Promise<void> | undefined;

type SpawnCase = {
	name: string;
	command: string;
	args: string[];
	script: 'ink' | 'minimal';
	withTerminal: boolean;
	withInputForwarding: boolean;
};

type CaseResult = {
	name: string;
	exitCode: number;
	lastLog: string;
	inputAvailable: 'yes' | 'no';
};

const terminalStream = (terminal: Terminal) =>
	new WritableStream({
		write(data) {
			terminal.write(data);
		},
	});

const getTerminalSize = (terminal: Terminal) => ({
	cols: Math.max(terminal.cols, 80),
	rows: Math.max(terminal.rows, 24),
});

const getWebContainer = async () => {
	if (!webContainerPromise) {
		webContainerPromise = WebContainer.boot();
	}

	return webContainerPromise;
};

const fileTree = {
	'package.json': {
		file: {
			contents: JSON.stringify(
				{
					name: 'ink-webcontainer-cli',
					private: true,
					type: 'module',
					dependencies: {
						ink: '^5.2.1',
						react: '^19.1.1',
					},
				},
				null,
				2,
			),
		},
	},
	'ink-cli.mjs': {
		file: {
			contents: `
import React from 'react';
import {render, Text, useApp, useInput} from 'ink';

const h = React.createElement;

if (typeof process.stdin.setRawMode !== 'function') process.stdin.setRawMode = () => {};
if (typeof process.stdin.ref !== 'function') process.stdin.ref = () => {};
if (typeof process.stdin.unref !== 'function') process.stdin.unref = () => {};
process.stdin.isTTY = true;
process.stdin.resume();

function App() {
	const {exit} = useApp();

	useInput((input, key) => {
		if (key.upArrow) {
			console.log('INPUT:UP');
		}
		if (key.downArrow) {
			console.log('INPUT:DOWN');
		}
		if (key.return) {
			console.log('INPUT:ENTER');
			exit();
		}
		if (input === 'q') {
			console.log('INPUT:Q');
			exit();
		}
	});

	React.useEffect(() => {
		console.log('READY:INK');
		const timer = setTimeout(() => {
			console.log('AUTO_EXIT:INK');
			exit();
		}, 1200);
		return () => clearTimeout(timer);
	}, [exit]);

	return h(Text, {color: 'green'}, 'Ink comparison CLI');
}

render(h(App));
`.trim(),
		},
	},
	'minimal-cli.mjs': {
		file: {
			contents: `
if (typeof process.stdin.setRawMode === 'function') {
	process.stdin.setRawMode(true);
}

process.stdin.resume();
console.log('READY:MINIMAL');

process.stdin.on('data', chunk => {
	const text = chunk.toString('utf8');
	if (text.includes('\\u001b[A')) {
		console.log('INPUT:UP');
	}
	if (text.includes('\\u001b[B')) {
		console.log('INPUT:DOWN');
	}
	if (text.includes('\\r')) {
		console.log('INPUT:ENTER');
		process.exit(0);
	}
});

setTimeout(() => {
	console.log('AUTO_EXIT:MINIMAL');
	process.exit(0);
}, 1200);
`.trim(),
		},
	},
} as const;

const spawnCases: SpawnCase[] = [
	{
		name: '1) jsh -c node cli.mjs / terminal: yes / stdinWriter: yes / Ink',
		command: 'jsh',
		args: ['-c', 'node ink-cli.mjs'],
		script: 'ink',
		withTerminal: true,
		withInputForwarding: true,
	},
	{
		name: '2) node cli.mjs / terminal: yes / stdinWriter: yes / Ink',
		command: 'node',
		args: ['ink-cli.mjs'],
		script: 'ink',
		withTerminal: true,
		withInputForwarding: true,
	},
	{
		name: '3) node cli.mjs / terminal: no / stdinWriter: yes / Ink',
		command: 'node',
		args: ['ink-cli.mjs'],
		script: 'ink',
		withTerminal: false,
		withInputForwarding: true,
	},
	{
		name: '4) node cli.mjs / terminal: yes / stdinWriter: no / Ink',
		command: 'node',
		args: ['ink-cli.mjs'],
		script: 'ink',
		withTerminal: true,
		withInputForwarding: false,
	},
	{
		name: '5) jsh -c node cli.mjs / terminal: yes / stdinWriter: yes / Minimal',
		command: 'jsh',
		args: ['-c', 'node minimal-cli.mjs'],
		script: 'minimal',
		withTerminal: true,
		withInputForwarding: true,
	},
	{
		name: '6) node cli.mjs / terminal: yes / stdinWriter: yes / Minimal',
		command: 'node',
		args: ['minimal-cli.mjs'],
		script: 'minimal',
		withTerminal: true,
		withInputForwarding: true,
	},
	{
		name: '7) node cli.mjs / terminal: no / stdinWriter: yes / Minimal',
		command: 'node',
		args: ['minimal-cli.mjs'],
		script: 'minimal',
		withTerminal: false,
		withInputForwarding: true,
	},
	{
		name: '8) node cli.mjs / terminal: yes / stdinWriter: no / Minimal',
		command: 'node',
		args: ['minimal-cli.mjs'],
		script: 'minimal',
		withTerminal: true,
		withInputForwarding: false,
	},
];

const extractLastLog = (output: string) => {
	const lines = output
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(Boolean);

	return lines.at(-1) ?? '(no output)';
};

const extractInputAvailable = (output: string) =>
	output.includes('INPUT:UP') || output.includes('INPUT:DOWN') ? 'yes' : 'no';

export default function App() {
	const terminalElementRef = useRef<HTMLDivElement | null>(null);
	const [status, setStatus] = useState('Initializing WebContainer...');
	const [results, setResults] = useState<CaseResult[]>([]);

	useEffect(() => {
		if (!terminalElementRef.current) {
			return;
		}

		let disposed = false;
		let terminal: Terminal | null = null;

		const boot = async () => {
			terminal = new Terminal({
				cursorBlink: true,
				convertEol: true,
				fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
				fontSize: 14,
				theme: {
					background: '#020617',
					foreground: '#dbeafe',
				},
			});
			terminal.open(terminalElementRef.current!);
			const activeTerminal = terminal;
			terminal.writeln('Booting browser sandbox...');

			const webContainer = await getWebContainer();
			if (disposed) {
				return;
			}

			if (!sandboxReadyPromise) {
				sandboxReadyPromise = (async () => {
					setStatus('Mounting CLI filesystem...');
					await webContainer.mount(fileTree);

					setStatus('Preparing sandbox dependencies...');
					await webContainer.fs.rm('node_modules', {recursive: true, force: true});
					await webContainer.fs.rm('package-lock.json', {force: true});

					setStatus('Installing dependencies in sandbox...');
					terminal.writeln('Installing: react ink');
					const installProcess = await webContainer.spawn('npm', ['install'], {
						terminal: getTerminalSize(activeTerminal),
					});
					void installProcess.output.pipeTo(terminalStream(activeTerminal));
					const installExitCode = await installProcess.exit;
					if (installExitCode !== 0) {
						throw new Error(`npm install failed with code ${installExitCode}`);
					}
				})();
			}

			await sandboxReadyPromise;
			if (disposed) {
				return;
			}

			const caseResults: CaseResult[] = [];

			for (const spawnCase of spawnCases) {
				if (disposed) {
					return;
				}

				setStatus(`Running ${spawnCase.name}`);
				terminal.writeln(`\r\n=== ${spawnCase.name} ===`);

				const spawnOptions = spawnCase.withTerminal
					? {terminal: getTerminalSize(activeTerminal)}
					: undefined;
				const process = await webContainer.spawn(spawnCase.command, spawnCase.args, spawnOptions);
				let output = '';

				const outputTask = (async () => {
					const reader = process.output.getReader();
					const decoder = new TextDecoder();
					try {
						while (true) {
							const {value, done} = await reader.read();
							if (done) {
								break;
							}
							const chunk = typeof value === 'string' ? value : decoder.decode(value, {stream: true});
							output += chunk;
							activeTerminal.write(chunk);
						}
					} finally {
						reader.releaseLock();
					}
				})();

				let stdinWriter: WritableStreamDefaultWriter<string> | null = null;
				if (spawnCase.withInputForwarding) {
					stdinWriter = process.input.getWriter();
					await new Promise(resolve => window.setTimeout(resolve, 250));
					await stdinWriter.write('\u001b[A');
					await stdinWriter.write('\u001b[B');
					await stdinWriter.write('\r');
					stdinWriter.releaseLock();
				}

				const exitCode = await process.exit;
				await outputTask;
				const result = {
					name: spawnCase.name,
					exitCode,
					lastLog: extractLastLog(output),
					inputAvailable: extractInputAvailable(output),
				} satisfies CaseResult;
				caseResults.push(result);
				terminal.writeln(`[summary] exit=${result.exitCode} lastLog=${result.lastLog} input=${result.inputAvailable}`);
			}

			setResults(caseResults);
			setStatus('Comparison completed.');
		};

		void boot().catch(error => {
			setStatus('WebContainer comparison failed');
			terminal?.writeln(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
		});

		return () => {
			disposed = true;
			terminal?.dispose();
		};
	}, []);

	return (
		<main className="app">
			<header>
				<h1>WebContainer spawn comparison</h1>
				<p>{status}</p>
				{results.length > 0 ? (
					<pre>
						{['case | exit code | last log | input', '---|---:|---|---', ...results.map(result => `${result.name} | ${result.exitCode} | ${result.lastLog} | ${result.inputAvailable}`)].join('\n')}
					</pre>
				) : null}
			</header>
			<div className="terminal" ref={terminalElementRef} />
		</main>
	);
}
