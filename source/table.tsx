import {Box, Text} from 'ink';
import {faker} from '@faker-js/faker';

type User = {
	id: number;
	name: string;
	email: string;
};

type Props = {
	readonly users?: User[];
};

const fakeUsers: User[] = Array.from({length: 10}, (_, index) => ({
	id: index,
	name: faker.internet.username(),
	email: faker.internet.email(),
}));

export default function Table({users = fakeUsers}: Props) {
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
