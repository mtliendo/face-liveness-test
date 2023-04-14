// pages/api/get.js

import { NextApiRequest, NextApiResponse } from 'next'
import { getRekognitionClient } from '../../helpers/rekognition'

type Data = {
	isLive: boolean
}
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const rekognition = await getRekognitionClient(req)

	const response = await rekognition
		.getFaceLivenessSessionResults({
			SessionId: req.query.sessionId as string,
		})
		.promise()

	if (response.Confidence === undefined) {
		res.status(200).json({
			isLive: false,
		})
		return
	}

	const isLive = response.Confidence > 90

	res.status(200).json({
		isLive,
	})
}
