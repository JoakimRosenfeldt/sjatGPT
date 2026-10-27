import { OPENROUTER_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

async function complete(model: string, prompt: string, response_format?: object) {
	const body = { model, messages: [{ role: 'user', content: prompt }], response_format };
	console.log('OpenRouter request:', JSON.stringify(body, null, 2));
	const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	const data = await result.json();
	console.log('OpenRouter response:', JSON.stringify(data, null, 2));
	if (!data.choices) throw new Error(`OpenRouter ${model}: ${data.error?.message}`);
	return data.choices[0].message.content as string;
}

export async function POST({ request }) {
	const { prompt } = await request.json();

	const [ingredients, name] = await Promise.all([
		complete('~typesafe/jev-latest', prompt, {
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
			'meta/muse-spark-1.3',
			'Come up with an unhinged brainrot name for a mixed drink. Do not mention any ingredients. Reply with only the name.'
		)
	]);

	return json({ ...JSON.parse(ingredients), name: name.trim().replace(/^"|"$/g, '') });
}
