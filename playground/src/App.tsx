import {useEffect, useRef, useState} from 'react';
import {WebContainer} from '@webcontainer/api';
import {Terminal} from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import './App.css';

let webContainerPromise: Promise<WebContainer> | undefined;
let sandboxReadyPromise: Promise<void> | undefined;

const getTerminalSize = (terminal: Terminal) => ({
	cols: Math.max(terminal.cols, 80),
	rows: Math.max(terminal.rows, 24),
});

const collectProcessOutput = async (
	processOutput: ReadableStream<string>,
	terminal: Terminal,
) => {
	const reader = processOutput.getReader();

	try {
		while (true) {
			const {value, done} = await reader.read();
			if (done) {
				break;
			}

			terminal.write(value);
		}
	} finally {
		reader.releaseLock();
	}
};

const wireTerminalInput = (
	processInput: WritableStream<string>,
	terminal: Terminal,
) => {
	const writer = processInput.getWriter();
	const onDataDisposable = terminal.onData(data => {
		void writer.write(data);
	});

	return () => {
		onDataDisposable.dispose();
		writer.releaseLock();
	};
};

const spawnCommand = async (
	webContainer: WebContainer,
	terminal: Terminal,
	command: string,
	args: string[],
	withTerminal: boolean,
) => {
	const process = await webContainer.spawn(command, args, {
		terminal: withTerminal ? getTerminalSize(terminal) : undefined,
	});

	const outputTask = collectProcessOutput(process.output, terminal);

	return {process, outputTask};
};

type CliLaunchMode = {
	label: string;
	command: string;
	args: string[];
	withTerminal: boolean;
	withStdinWriter: boolean;
};

const cliLaunchModes: CliLaunchMode[] = [
	{
		label: 'jsh -c node + terminal + stdinWriter',
		command: 'jsh',
		args: ['-c', 'node ink-cli.mjs'],
		withTerminal: true,
		withStdinWriter: true,
	},
	{
		label: 'node + terminal + stdinWriter',
		command: 'node',
		args: ['ink-cli.mjs'],
		withTerminal: true,
		withStdinWriter: true,
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
						ink: '^4.4.1',
						react: '^18.3.1',
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

render(h(App), {exitOnCtrlC: false});
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
					const {process: installProcess, outputTask} = await spawnCommand(
						webContainer,
						activeTerminal,
						'npm',
						['install'],
						true,
					);
					const installExitCode = await installProcess.exit;
					await outputTask;
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

			const failedLaunches: Array<{label: string; exitCode: number}> = [];

			for (const [index, mode] of cliLaunchModes.entries()) {
				activeTerminal.writeln(`\r\n[launch] ${mode.label}`);
				const {process, outputTask} = await spawnCommand(
					webContainer,
					activeTerminal,
					mode.command,
					mode.args,
					mode.withTerminal,
				);
				cleanupInput = mode.withStdinWriter
					? wireTerminalInput(process.input, activeTerminal)
					: undefined;
				const exitCode = await process.exit;
				await outputTask;
				cleanupInput?.();
				cleanupInput = undefined;

				if (exitCode === 0) {
					setStatus('Ink CLI completed normally. Reload to restart.');
					return;
				}

				failedLaunches.push({label: mode.label, exitCode});
				const hasNextMode = index < cliLaunchModes.length - 1;
				if (hasNextMode) {
					activeTerminal.writeln(
						`[warn] CLI exited with code ${exitCode}. Trying fallback launch mode...`,
					);
				}
			}

			const failureSummary = failedLaunches
				.map(failure => `${failure.label}: ${failure.exitCode}`)
				.join(' | ');
			setStatus(
				`CLI failed in all launch modes (${failureSummary || 'unknown'}). Reload to restart.`,
			);
		};

		void boot().catch(error => {
			setStatus('WebContainer run failed');
			terminal?.writeln(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
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
