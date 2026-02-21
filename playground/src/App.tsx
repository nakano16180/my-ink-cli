import {useMemo, useState} from 'react';
import './App.css';

type Task = {
	id: string;
	label: string;
	state: 'todo' | 'doing' | 'done';
};

const initialTasks: Task[] = [
	{id: '1', label: 'ink のコンポーネント設計', state: 'todo'},
	{id: '2', label: 'CLI のユースケース確認', state: 'doing'},
	{id: '3', label: '表示内容の最終調整', state: 'done'},
];

export default function App() {
	const [tasks, setTasks] = useState(initialTasks);

	const summary = useMemo(() => {
		return tasks.reduce(
			(accumulator, task) => {
				accumulator[task.state] += 1;
				return accumulator;
			},
			{todo: 0, doing: 0, done: 0},
		);
	}, [tasks]);

	const cycleTask = (id: string) => {
		setTasks(previous =>
			previous.map(task => {
				if (task.id !== id) {
					return task;
				}

				if (task.state === 'todo') {
					return {...task, state: 'doing'};
				}

				if (task.state === 'doing') {
					return {...task, state: 'done'};
				}

				return {...task, state: 'todo'};
			}),
		);
	};

	return (
		<main className="page">
			<section className="panel">
				<h1>my-ink-cli playground</h1>
				<p>
					GitHub Pages に配置する想定の、Vite + TypeScript + React ベースの
					検証用画面です。
				</p>

				<dl className="summary">
					<div>
						<dt>TODO</dt>
						<dd>{summary.todo}</dd>
					</div>
					<div>
						<dt>DOING</dt>
						<dd>{summary.doing}</dd>
					</div>
					<div>
						<dt>DONE</dt>
						<dd>{summary.done}</dd>
					</div>
				</dl>

				<ul>
					{tasks.map(task => (
						<li key={task.id}>
							<button type="button" onClick={() => cycleTask(task.id)}>
								<strong>{task.label}</strong>
								<span>{task.state}</span>
							</button>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
