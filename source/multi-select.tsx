import React, {useState} from 'react';
import {Box, Text} from 'ink';
import MultiSelect from 'ink-multi-select';

type MultiSelectItem = {
	label: string;
	value: string;
};

const items: MultiSelectItem[] = [
	{label: 'Accessibility', value: 'accessibility'},
	{label: 'Performance', value: 'performance'},
	{label: 'Animations', value: 'animations'},
	{label: 'Theming', value: 'theming'},
	{label: 'Internationalization', value: 'i18n'},
];

export default function MultiSelectDemo() {
	const [selectedItems, setSelectedItems] = useState<MultiSelectItem[]>([]);

	const handleSubmit = (submittedItems: MultiSelectItem[]) => {
		setSelectedItems(submittedItems);
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="cyan">MultiSelect input</Text>
			</Box>
			{selectedItems.length === 0 && (
				<Box flexDirection="column">
					<Text dimColor>Use space to toggle items, then press Enter.</Text>
					<MultiSelect items={items} onSubmit={handleSubmit} />
				</Box>
			)}
			{selectedItems.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text color="green">Selected topics:</Text>
					{selectedItems.map(item => (
						<Text key={item.value}>• {item.label}</Text>
					))}
					<Text dimColor>Press Esc to return to the menu.</Text>
				</Box>
			)}
		</Box>
	);
}
