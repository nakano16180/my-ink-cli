import {useMemo, useState} from 'react';
import {Box, Text, useInput} from 'ink';

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
	const [activeIndex, setActiveIndex] = useState(0);
	const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
	const [isSubmitted, setIsSubmitted] = useState(false);

	const selectedItems = useMemo(
		() => items.filter(item => selectedValues.has(item.value)),
		[selectedValues],
	);

	useInput((input, key) => {
		if (isSubmitted) {
			return;
		}

		if (key.upArrow) {
			setActiveIndex(index => (index === 0 ? items.length - 1 : index - 1));
			return;
		}

		if (key.downArrow) {
			setActiveIndex(index => (index === items.length - 1 ? 0 : index + 1));
			return;
		}

		if (input === ' ') {
			const activeItem = items[activeIndex];
			if (!activeItem) {
				return;
			}

			setSelectedValues(values => {
				const nextValues = new Set(values);
				if (nextValues.has(activeItem.value)) {
					nextValues.delete(activeItem.value);
				} else {
					nextValues.add(activeItem.value);
				}

				return nextValues;
			});
			return;
		}

		if (key.return) {
			setIsSubmitted(true);
		}
	});

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text color="cyan">MultiSelect input</Text>
			</Box>
			{!isSubmitted && (
				<Box flexDirection="column">
					<Text dimColor>
						Use ↑/↓ to move, Space to toggle, Enter to submit.
					</Text>
					{items.map((item, index) => {
						const isActive = index === activeIndex;
						const isSelected = selectedValues.has(item.value);

						return (
							<Text key={item.value} color={isActive ? 'green' : undefined}>
								{isActive ? '❯' : ' '} [{isSelected ? 'x' : ' '}] {item.label}
							</Text>
						);
					})}
				</Box>
			)}
			{isSubmitted ? (
				<Box flexDirection="column" marginTop={1}>
					<Text color="green">Selected topics:</Text>
					{selectedItems.length === 0 && <Text dimColor>(none)</Text>}
					{selectedItems.map(item => (
						<Text key={item.value}>• {item.label}</Text>
					))}
					<Text dimColor>Press Esc to return to the menu.</Text>
				</Box>
			) : null}
		</Box>
	);
}
