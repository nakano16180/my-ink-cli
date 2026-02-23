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
						'ink-select-input': '^6.2.0',
						react: '^19.1.1',
						'react-dom': '^19.1.1',
					},
				},
				null,
				2,
			),
		},
	},
	'select-options.mjs': {
		file: {
			contents: `
export const people = [
	{label: 'Alice', value: 'alice'},
	{label: 'Bob', value: 'bob'},
	{label: 'Charlie', value: 'charlie'},
	{label: 'Diana', value: 'diana'},
	{label: 'Ethan', value: 'ethan'},
];
`.trim(),
		},
	},
	'cli.mjs': {
		file: {
			contents: `
import React, {useMemo, useState} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import {people} from './select-options.mjs';

const h = React.createElement;

if (typeof process.stdin.setRawMode !== 'function') {
	process.stdin.setRawMode = () => {};
}

if (typeof process.stdin.ref !== 'function') {
	process.stdin.ref = () => {};
}

if (typeof process.stdin.unref !== 'function') {
	process.stdin.unref = () => {};
}

process.stdin.isTTY = true;
process.stdin.resume();

const steps = [
	{label: 'Single select', value: 'single'},
	{label: 'Multi select', value: 'multi'},
	{label: 'Exit', value: 'exit'},
];

function MultiSelect({items, onSubmit}) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [selectedValues, setSelectedValues] = useState([]);

	useInput((input, key) => {
		if (key.upArrow) {
			setActiveIndex(previous =>
				previous === 0 ? items.length - 1 : previous - 1,
			);
			return;
		}

		if (key.downArrow) {
			setActiveIndex(previous =>
				previous === items.length - 1 ? 0 : previous + 1,
			);
			return;
		}

		if (input === ' ') {
			const item = items[activeIndex];
			setSelectedValues(previous =>
				previous.includes(item.value)
					? previous.filter(value => value !== item.value)
					: [...previous, item.value],
			);
			return;
		}

		if (key.return) {
			onSubmit(selectedValues);
		}
	});

	return h(
		Box,
		{flexDirection: 'column', marginTop: 1},
		h(Text, {color: 'yellow'}, 'Multi-select mode'),
		h(Text, {dimColor: true}, '↑/↓ to move, Space to toggle, Enter to confirm'),
		...items.map((item, index) => {
			const isActive = index === activeIndex;
			const isSelected = selectedValues.includes(item.value);
			const prefix = isSelected ? '[x]' : '[ ]';
			return h(
				Text,
				{key: item.value, color: isActive ? 'cyan' : undefined},
				(isActive ? '❯' : ' ') + ' ' + prefix + ' ' + item.label,
			);
		}),
	);
}

function App() {
	const {exit} = useApp();
	const [screen, setScreen] = useState('menu');
	const [singleChoice, setSingleChoice] = useState('');
	const [multiChoice, setMultiChoice] = useState([]);

	const menuItems = useMemo(
		() =>
			steps.map(step => ({
				label: step.label,
				value: step.value,
			})),
		[],
	);

	if (screen === 'menu') {
		return h(
			Box,
			{flexDirection: 'column'},
			h(Text, {color: 'green'}, 'Ink CLI running in WebContainer'),
			h(Text, {dimColor: true}, 'Choose a mode (arrow keys + Enter)'),
			h(SelectInput, {
				items: menuItems,
				onSelect: item => {
					if (item.value === 'single') setScreen('single');
					if (item.value === 'multi') setScreen('multi');
					if (item.value === 'exit') exit();
				},
			}),
			singleChoice ? h(Text, null, 'Last single: ' + singleChoice) : null,
			multiChoice.length
				? h(Text, null, 'Last multi: ' + multiChoice.join(', '))
				: null,
		);
	}

	if (screen === 'single') {
		return h(
			Box,
			{flexDirection: 'column'},
			h(Text, {color: 'yellow'}, 'Single-select mode'),
			h(Text, {dimColor: true}, '↑/↓ + Enter to choose'),
			h(SelectInput, {
				items: people,
				onSelect: item => {
					setSingleChoice(item.label);
					setScreen('menu');
				},
			}),
		);
	}

	return h(MultiSelect, {
		items: people,
		onSubmit: values => {
			const labels = people
				.filter(item => values.includes(item.value))
				.map(item => item.label);
			setMultiChoice(labels);
			setScreen('menu');
		},
	});
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
		let stdinWriter: WritableStreamDefaultWriter<string> | null = null;
		let inputDisposable: ReturnType<Terminal['onData']> | null = null;
		let removeResizeListener: (() => void) | null = null;

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
					terminal.writeln('Installing: react react-dom ink ink-select-input');
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

			setStatus('Starting Ink CLI...');
			terminal.writeln('\r\nStarting interactive Ink CLI\r\n');
			const cliProcess = await webContainer.spawn('node', ['cli.mjs'], {
				terminal: getTerminalSize(activeTerminal),
			});

			if (disposed) {
				void cliProcess.kill();
				return;
			}

			stdinWriter = cliProcess.input.getWriter();
			inputDisposable = activeTerminal.onData(data => {
				void stdinWriter?.write(data);
			});

			const handleResize = () => {
				cliProcess.resize(getTerminalSize(activeTerminal));
			};
			window.addEventListener('resize', handleResize);
			removeResizeListener = () => {
				window.removeEventListener('resize', handleResize);
			};

			void cliProcess.output.pipeTo(terminalStream(activeTerminal));
			setStatus('Ink CLI is running. Use arrow keys + Enter.');

			const exitCode = await cliProcess.exit;
			removeResizeListener?.();
			removeResizeListener = null;
			inputDisposable.dispose();
			inputDisposable = null;
			stdinWriter.releaseLock();
			stdinWriter = null;

			if (disposed) {
				return;
			}

			setStatus(`CLI exited with code ${exitCode}`);
			terminal.writeln(`\r\n[process exited: ${exitCode}]`);
		};

		void boot().catch(error => {
			setStatus('WebContainer boot failed');
			terminal?.writeln(`\r\nError: ${error instanceof Error ? error.message : String(error)}`);
		});

		return () => {
			disposed = true;
			removeResizeListener?.();
			removeResizeListener = null;
			inputDisposable?.dispose();
			if (stdinWriter) {
				void stdinWriter.close();
				stdinWriter.releaseLock();
				stdinWriter = null;
			}
			terminal?.dispose();
		};
	}, []);

	return (
		<main className="app">
			<header>
				<h1>WebContainer + Ink CLI</h1>
				<p>{status}</p>
			</header>
			<div className="terminal" ref={terminalElementRef} />
		</main>
	);
}
