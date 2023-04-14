// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getRekognitionClient } from '../../helpers/rekognition'

type Data = {
	sessionId: string
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const rekognition = await getRekognitionClient(req)
	const response = await rekognition.createFaceLivenessSession().promise()

	res.status(200).json({ sessionId: response.SessionId })
}
