import React, {useEffect, useState} from 'react';
import {render, Text} from 'ink';
import SelectInput from 'ink-select-input';

type Props = {
	name: string | undefined;
};

export default function App({name = 'Stranger'}: Props) {
	const [selected, setSelected] = useState<string | null>(null);

	const handleSelect = item => {
		// `item` = { label: 'First', value: 'first' }
		console.log(`You selected: ${item.label} (${item.value})`);
	};

	const items = [
		{
			label: 'First',
			value: 'first',
		},
		{
			label: 'Second',
			value: 'second',
		},
		{
			label: 'Third',
			value: 'third',
		},
	];

	return (
		<>
			{!selected && (
				<SelectInput
					items={items}
					onSelect={item => {
						setSelected(item.value);
						handleSelect(item);
					}}
				/>
			)}
			{selected && <Text color="green">You selected: {selected} </Text>}
		</>
	);
}
