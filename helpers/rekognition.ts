// helpers/rekognition.ts
import { NextApiRequest } from 'next'
import { Amplify, withSSRContext } from 'aws-amplify'
import Rekognition from 'aws-sdk/clients/rekognition'
import awsExports from '../src/aws-exports'

Amplify.configure({ ...awsExports, ssr: true })

export async function getRekognitionClient(req: NextApiRequest) {
	const { Credentials } = withSSRContext({ req })

	const credentials = await Credentials.get()
	const rekognitionClient = new Rekognition({
		region: 'us-east-1',
		credentials,
		endpoint: 'https://rekognition.us-east-1.amazonaws.com',
	})

	return rekognitionClient
}
