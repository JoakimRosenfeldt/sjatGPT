import { OPENROUTER_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

async function complete(model: string, prompt: string, response_format?: object) {
	const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], response_format })
	});
	const data = await result.json();
	return data.choices[0].message.content as string;
}

export async function POST({ request }) {
	const { prompt } = await request.json();

	const [ingredients, name] = await Promise.all([
		complete('typesafe/jev-router', prompt, {
			type: 'json_schema',
			json_schema: {
				name: 'drink',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						alcoholics: { type: 'array', items: { type: 'string' } },
						others: { type: 'array', items: { type: 'string' } }
					},
					required: ['alcoholics', 'others'],
					additionalProperties: false
				}
			}
		}),
		complete(
			'mistralai/mistral-nemo',
			'Come up with an unhinged brainrot name for a mixed drink. Do not mention any ingredients. Reply with only the name.'
		)
	]);

	return json({ ...JSON.parse(ingredients), name: name.trim().replace(/^"|"$/g, '') });
}
