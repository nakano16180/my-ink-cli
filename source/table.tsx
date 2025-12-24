import React from 'react';
import {Box, Text,} from 'ink';
import {faker} from '@faker-js/faker';

const fakeUsers = Array.from({length: 10})
	.fill(true)
	.map((_, index) => ({
		id: index,
		name: faker.internet.username(),
		email: faker.internet.email(),
	}));

type props = {
    id: number;
    name: string;
    email: string;
}[];

export default function Table({users = fakeUsers}: {users?: props}) {
	return (
		<Box flexDirection="column" width={80}>
			<Box>
				<Box width="10%">
					<Text>ID</Text>
				</Box>

				<Box width="50%">
					<Text>Name</Text>
				</Box>

				<Box width="40%">
					<Text>Email</Text>
				</Box>
			</Box>

			{users.map(user => (
				<Box key={user.id}>
					<Box width="10%">
						<Text>{user.id}</Text>
					</Box>

					<Box width="50%">
						<Text>{user.name}</Text>
					</Box>

					<Box width="40%">
						<Text>{user.email}</Text>
					</Box>
				</Box>
			))}
		</Box>
	);
}
