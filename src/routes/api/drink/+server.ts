import { OPENROUTER_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

async function openrouter(path: string, body: object) {
	console.log('OpenRouter request:', JSON.stringify(body, null, 2));
	const result = await fetch(`https://openrouter.ai/api/${path}`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	const data = await result.json();
	console.log('OpenRouter response:', JSON.stringify(data, null, 2));
	if (data.error) throw new Error(`OpenRouter ${path}: ${data.error.message}`);
	return data;
}

function choice(instructions: string, options: string[]) {
	return {
		type: 'choice',
		instructions,
		criteria: Object.fromEntries(options.map((option) => [option, option]))
	};
}

// Random order weighted by Jev's probabilities, so the likeliest ingredients usually come first.
function weightedShuffle(probabilities: Record<string, number>) {
	return Object.entries(probabilities)
		.map(([option, p]) => ({ option, key: Math.random() ** (1 / p) }))
		.sort((a, b) => b.key - a.key)
		.map((it) => it.option);
}

export async function POST({ request }) {
	const { alcoholics, others } = await request.json();

	const [decision, completion] = await Promise.all([
		openrouter('alpha/decisions', {
			model: '~typesafe/jev-latest',
			state: { alcoholics, others },
			questions: {
				alcoholics: choice('Which spirit is the best base for a tasty mixed drink?', alcoholics),
				others: choice('Which mixer goes best in a tasty mixed drink?', others)
			}
		}),
		openrouter('v1/chat/completions', {
			model: 'mistralai/mistral-nemo',
			messages: [
				{
					role: 'user',
					content:
						'Come up with an unhinged brainrot name for a mixed drink. Do not mention any ingredients. Reply with only the name.'
				}
			]
		})
	]);

	return json({
		name: completion.choices[0].message.content.trim().replace(/^"|"$/g, ''),
		alcoholics: weightedShuffle(decision.answers.alcoholics.probabilities),
		others: weightedShuffle(decision.answers.others.probabilities)
	});
}
