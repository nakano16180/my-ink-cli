import {useState} from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';

type SelectItem = {
	label: string;
	value: string;
};

const items: SelectItem[] = [
	{label: 'Ink', value: 'ink'},
	{label: 'React', value: 'react'},
	{label: 'Node.js', value: 'node'},
	{label: 'TypeScript', value: 'typescript'},
];

export default function SelectDemo() {
	const [selected, setSelected] = useState<SelectItem | undefined>(undefined);

	const handleSelect = (item: SelectItem) => {
		setSelected(item);
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="cyan">Select input</Text>
			</Box>
			{!selected && <SelectInput items={items} onSelect={handleSelect} />}
			{selected ? (
				<Box flexDirection="column" marginTop={1}>
					<Text color="green">Selected: {selected.label}</Text>
					<Text dimColor>Choose another demo with Esc to keep exploring.</Text>
				</Box>
			) : null}
		</Box>
	);
}
