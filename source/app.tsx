import {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import SelectInput from 'ink-select-input';
import MultiSelectDemo from './multi-select.js';
import SelectDemo from './select.js';
import Table from './table.js';

type Props = {
	readonly name?: string;
};

export default function App({name = 'Stranger'}: Props) {
	const [activeDemo, setActiveDemo] = useState<string | undefined>(undefined);

	useInput((_, key) => {
		if (activeDemo && key.escape) {
			setActiveDemo(undefined);
		}
	});

	const handleSelect = (item: {label: string; value: string}) => {
		setActiveDemo(item.value);
	};

	const items = [
		{
			label: 'Select input',
			value: 'select',
		},
		{
			label: 'MultiSelect input',
			value: 'multi-select',
		},
		{
			label: 'Table example',
			value: 'table',
		},
	];

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="cyan">Ink UI demo menu</Text>
			</Box>
			{!activeDemo && (
				<Box flexDirection="column" marginBottom={1}>
					<Text dimColor>{name}, choose a demo to preview:</Text>
					<SelectInput items={items} onSelect={handleSelect} />
				</Box>
			)}
			{activeDemo === 'select' && <SelectDemo />}
			{activeDemo === 'multi-select' && <MultiSelectDemo />}
			{activeDemo === 'table' && <Table />}
			{activeDemo ? (
				<Text dimColor>Press Esc to return to the menu.</Text>
			) : null}
		</Box>
	);
}
