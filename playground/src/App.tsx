import {useEffect, useRef, useState} from 'react';
import {WebContainer} from '@webcontainer/api';
import {Terminal} from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import './App.css';

let webContainerPromise: Promise<WebContainer> | undefined;
let sandboxReadyPromise: Promise<void> | undefined;

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

type CliLaunchMode = {
	label: string;
	command: string;
	args: string[];
	withTerminal: boolean;
	withStdinWriter: boolean;
};

const cliLaunchModes: CliLaunchMode[] = [
	{
		label: 'node + terminal + stdinWriter',
		command: 'node',
		args: ['ink-cli.mjs'],
		withTerminal: true,
		withStdinWriter: true,
	},
	{
		label: 'node + no terminal + stdinWriter',
		command: 'node',
		args: ['ink-cli.mjs'],
		withTerminal: false,
		withStdinWriter: true,
	},
	{
		label: 'node + terminal + no stdinWriter',
		command: 'node',
		args: ['ink-cli.mjs'],
		withTerminal: true,
		withStdinWriter: false,
	},
];

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
						ink: '^6.5.1',
						react: '^19.2.0',
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
import {render, Box, Text, useInput} from 'ink';

const h = React.createElement;

if (typeof process.stdin.setRawMode !== 'function') process.stdin.setRawMode = () => {};
if (typeof process.stdin.ref !== 'function') process.stdin.ref = () => {};
if (typeof process.stdin.unref !== 'function') process.stdin.unref = () => {};
process.stdin.isTTY = true;
process.stdin.resume();

const items = ['Ink', 'React', 'Node.js', 'TypeScript'];

function App() {
	const [selectedIndex, setSelectedIndex] = React.useState(0);
	const [submitted, setSubmitted] = React.useState(false);

	useInput((input, key) => {
		if (submitted) {
			if (input === 'q') {
				process.exit(0);
			}

			return;
		}

		if (key.upArrow) {
			setSelectedIndex(index => (index === 0 ? items.length - 1 : index - 1));
		}

		if (key.downArrow) {
			setSelectedIndex(index => (index === items.length - 1 ? 0 : index + 1));
		}

		if (key.return) {
			setSubmitted(true);
		}
	});

	if (submitted) {
		return h(Box, {flexDirection: 'column'}, [
			h(Text, {key: 'title', color: 'green'}, 'Selected: ' + items[selectedIndex]),
			h(Text, {key: 'hint', dimColor: true}, 'Press q to quit.'),
		]);
	}

	return h(Box, {flexDirection: 'column'}, [
		h(Text, {key: 'title', color: 'cyan'}, 'WebContainer Ink interactive menu'),
		h(Text, {key: 'hint', dimColor: true}, 'Use ↑/↓ then Enter.'),
		...items.map((item, index) =>
			h(
				Text,
				{key: item, color: index === selectedIndex ? 'green' : undefined},
				(index === selectedIndex ? '❯ ' : '  ') + item,
			),
		),
	]);
}

render(h(App));
`.trim(),
		},
	},
} as const;

export default function App() {
	const terminalElementRef = useRef<HTMLDivElement | null>(null);
	const [status, setStatus] = useState('Initializing WebContainer...');

	useEffect(() => {
		if (!terminalElementRef.current) {
			return;
		}

		let disposed = false;
		let terminal: Terminal | null = null;
		let cleanupInput: (() => void) | undefined;

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
			activeTerminal.writeln('Booting browser sandbox...');

			const webContainer = await getWebContainer();
			if (disposed) {
				return;
			}

			if (!sandboxReadyPromise) {
				sandboxReadyPromise = (async () => {
					setStatus('Mounting Ink CLI files...');
					await webContainer.mount(fileTree);

					setStatus('Preparing dependencies...');
					await webContainer.fs.rm('node_modules', {
						recursive: true,
						force: true,
					});
					await webContainer.fs.rm('package-lock.json', {force: true});

					setStatus('Installing dependencies in sandbox...');
					activeTerminal.writeln('Installing: react ink');
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

			setStatus('Running Ink CLI. Try arrow keys + Enter in terminal below.');
			activeTerminal.writeln('\r\n=== Starting Ink CLI ===');

			let lastExitCode: number | undefined;

			for (const mode of cliLaunchModes) {
				activeTerminal.writeln(`\r\n[launch] ${mode.label}`);

				const process = await webContainer.spawn(mode.command, mode.args, {
					terminal: mode.withTerminal ? getTerminalSize(activeTerminal) : undefined,
				});

				if (mode.withStdinWriter) {
					const writer = process.input.getWriter();
					const onDataDisposable = activeTerminal.onData(data => {
						void writer.write(data);
					});
					cleanupInput = () => {
						onDataDisposable.dispose();
						writer.releaseLock();
					};
				} else {
					cleanupInput = undefined;
				}

				void process.output.pipeTo(terminalStream(activeTerminal));
				const exitCode = await process.exit;
				cleanupInput?.();
				cleanupInput = undefined;
				lastExitCode = exitCode;

				if (exitCode === 0) {
					setStatus('Ink CLI completed normally. Reload to restart.');
					return;
				}

				if (exitCode !== 13) {
					setStatus(`CLI exited with code ${exitCode}. Reload to restart.`);
					return;
				}

				activeTerminal.writeln('[warn] CLI exited with code 13. Trying fallback launch mode...');
			}

			setStatus(`CLI exited with code ${lastExitCode ?? 'unknown'}. Reload to restart.`);
		};

		void boot().catch(error => {
			setStatus('WebContainer run failed');
			terminal?.writeln(
				`\r\nError: ${error instanceof Error ? error.message : String(error)}`,
			);
		});

		return () => {
			disposed = true;
			cleanupInput?.();
			terminal?.dispose();
		};
	}, []);

	return (
		<main className="app">
			<header>
				<h1>WebContainer Ink playground</h1>
				<p>{status}</p>
			</header>
			<div className="terminal" ref={terminalElementRef} />
		</main>
	);
}
