import { OPENROUTER_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const { prompt } = await request.json();

	const result = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'typesafe/jev-router',
			messages: [{ role: 'user', content: prompt }],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'drink',
					strict: true,
					schema: {
						type: 'object',
						properties: {
							name: { type: 'string' },
							alcoholics: { type: 'array', items: { type: 'string' } },
							others: { type: 'array', items: { type: 'string' } }
						},
						required: ['name', 'alcoholics', 'others'],
						additionalProperties: false
					}
				}
			}
		})
	});

	const data = await result.json();
	return json(JSON.parse(data.choices[0].message.content));
}
