import React from 'react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'
import { Loader, ThemeProvider, withAuthenticator } from '@aws-amplify/ui-react'
import config from '../src/aws-exports'

function LivenessQuickStartReact() {
	const [loading, setLoading] = React.useState<boolean>(true)
	const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{
		sessionId: string
	} | null>(null)

	React.useEffect(() => {
		const fetchCreateLiveness = async () => {
			/*
			 * This should be replaced with a real call to your own backend API
			 */
			const response = await fetch('/api/create')
			const data = await response.json()
			console.log('the data is', data)
			setCreateLivenessApiData(data)
			setLoading(false)
		}

		fetchCreateLiveness()
	}, [])

	const handleAnalysisComplete = async () => {
		/*
		 * This should be replaced with a real call to your own backend API
		 */

		// the sessionId
		console.log(
			'createLivenessApiData.sessionId',
			createLivenessApiData.sessionId
		)
		if (!createLivenessApiData) return

		const response = await fetch(
			`/api/get?sessionId=${createLivenessApiData.sessionId}`
		)
		const data = await response.json()

		/*
		 * Note: The isLive flag is not returned from the GetFaceLivenessSession API
		 * This should be returned from your backend based on the score that you
		 * get in response. Based on the return value of your API you can determine what to render next.
		 * Any next steps from an authorization perspective should happen in your backend and you should not rely
		 * on this value for any auth related decisions.
		 */
		if (data.isLive) {
			console.log('User is live')
		} else {
			console.log('User is not live')
		}
	}

	return (
		<ThemeProvider>
			{loading ? (
				<Loader />
			) : (
				<FaceLivenessDetector
					sessionId={createLivenessApiData!.sessionId}
					region={config.aws_project_region}
					onAnalysisComplete={handleAnalysisComplete}
				/>
			)}
		</ThemeProvider>
	)
}

export default withAuthenticator(LivenessQuickStartReact)
