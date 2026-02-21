import {useState} from 'react';
import {Text} from 'ink';
import SelectInput from 'ink-select-input';
import Table from './table.js';

type Props = {
	readonly name?: string;
};

const items = [
	{label: 'First', value: 'first'},
	{label: 'Second', value: 'second'},
	{label: 'Third', value: 'third'},
	{label: 'example/table.tsx', value: 'table example'},
];

export default function App({name = 'Stranger'}: Props) {
	const [selected, setSelected] = useState<string>();

	const handleSelect = (item: {value: string}) => {
		setSelected(item.value);
	};

	if (!selected) {
		return <SelectInput items={items} onSelect={handleSelect} />;
	}

	if (selected === 'table example') {
		return <Table />;
	}

	return (
		<Text color="green">
			{name} selected: {selected}
		</Text>
	);
}
