# Steps

- Started here: https://ui.docs.amplify.aws/react/connected-components/liveness

1. install package and deps

```sh
npx create-next-app face-liveness-test

npm i @aws-amplify/ui-react aws-amplify @aws-amplify/ui-react-liveness
```

Then went here: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-programming-api.html

Says I need to do 2 things:

1. Create a Session
2. Get the results from the session.

The mental model is a little murky on why this is needed and how the flow comes together. But moving on.

The rest of this page tells me more about the API's. But as a FED, I don't really know or care what is happening...I just want to get this working in my app.

The next section talks about setting this up in NextJS. This should've been where the Amplify docs took me.

## NextJS Setup

1. Install the aws-sdk

- The install link takes me [here](https://aws.amazon.com/sdk-for-javascript/). Just gimme the code snippet to install.

```sh
npm i aws-sdk
```

This installed v2.1358.0.

copy and pasted the helper:

```ts
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
```

> 🗒️ `const { Credentials } = withSSRContext({ req })` I didn't know that we could do that. We should explore this more...

Next I made the `api/create.ts` route:

```ts
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { getRekognitionClient } from '../../helpers/rekognition'

type Data = {
	session: string
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Data>
) {
	const rekognition = await getRekognitionClient(req)
	const response = await rekognition.createFaceLivenessSession().promise()

	res.status(200).json({ session: response.SessionId })
}
```

> 🚨 Good thing I'm using TypeScript because [the docs](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-backend-example.html) don't pass the `req` to the `getRekognitionClient`.

2. In the `pages/api/get.ts` file:

I created the file:

```ts
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
```

> 🚨 Same thing about missing the req. Also, the response can be undefined.

This looks like it. Was it that easy?

The [next section](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-calling-apis.html) talks about testing this by install python or Java 😴 Naw--let's test this in prod! Honestly, this feels super weird since I was just following a NextJS flow. Not to mention, I started this whole thing in the Amplify UI docs and ended up in a section talkign about Java. I'm actually really confused why testing this out wouldn't be with the NextJS stuff I just made 😅

## Configuring the UI

It looks like this is ready for me to use 🤷‍♂️ [The docs](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-configure-cutomize-amplify.html) suggest so.

Let's do it by heading back to the ui docs!

1. Adding auth

```sh
amplify add auth
```

Accepting the defaults and moving on.
Whoops. Never did an `init`.

```sh
amplify init -y && amplify add auth
```

Once the defaults are accepted, I pushed up:

```sh
amplify push -y
```

2. Configuring the role

Looks like I have to update the auth/unauth role of the idenity pool so that the `rekognition:StartFaceLivenessSession` action is allowed. The docs tell the user to do this through the AWS Console.

Not a fan of updating stuff in the AWS Console. So I'm not gonna do it. Let's see if the `amplify override` command can help us out!

I wanto to override the authRole to include the following policy:

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": "rekognition:StartFaceLivenessSession",
			"Resource": "*"
		}
	]
}
```

```sh
amplify override auth
```

10 minutes in. As someone who creates and updates identity pool policies in the CDK, this does not feel like the same thing. I am becoming flustered and am toggling through the type files trying to figure this out.

Gave up after 15 minutes. Adding it through the console. Took 2 minutes. But so far, I've interacted with my terminal, editor, amplify docs site, aws docs, and aws console to add this one feature.

3. Init Amplify

Simple. Added the following:

```ts
import { AmplifyProvider } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import type { AppProps } from 'next/app'
import { Amplify } from 'aws-amplify'
import config from '../src/aws-exports'
Amplify.configure(config)

export default function App({ Component, pageProps }: AppProps) {
	return (
		<AmplifyProvider>
			<Component {...pageProps} />
		</AmplifyProvider>
	)
}
```

The moment of truth. Next up is a big chunk of code for a FaceLiveness Component.

I have no idea where to put it😅

Gonna replace my entire home page with it and see what happens.

```ts
import React from 'react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'
import { Loader, ThemeProvider } from '@aws-amplify/ui-react'

export function LivenessQuickStartReact() {
	const [loading, setLoading] = React.useState<boolean>(true)
	const [createLivenessApiData, setCreateLivenessApiData] = React.useState<{
		sessionId: string
	} | null>(null)

	React.useEffect(() => {
		const fetchCreateLiveness = async () => {
			/*
			 * This should be replaced with a real call to your own backend API
			 */
			await new Promise((r) => setTimeout(r, 2000))
			const mockResponse = { sessionId: 'mockSessionId' }
			const data = mockResponse

			setCreateLivenessApiData(data)
			setLoading(false)
		}

		fetchCreateLiveness()
	}, [])

	const handleAnalysisComplete = async () => {
		/*
		 * This should be replaced with a real call to your own backend API
		 */
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
					sessionId={createLivenessApiData.sessionId}
					region="us-east-1"
					onAnalysisComplete={handleAnalysisComplete}
				/>
			)}
		</ThemeProvider>
	)
}
```

Looking at the code, there are a couple of areas that say "this should be replaced by real code from your backend. If the docs take me through a tutorial that assumes nextjs, should this be updated to support that?

A small update to the FaceLivenessDetector Component: `region={config.aws_project_region}`

Also:
`export default withAuthenticator(LivenessQuickStartReact)`

```sh
error - Error [CredentialsError]: Missing credentials in config, if using AWS_CONFIG_FILE, set AWS_SDK_LOAD_CONFIG=1
```

I changed my frontend to use `{ssr:true}` and ran again:

```sh
error - AccessDeniedException: User: arn:aws:sts::311853295989:assumed-role/amplify-facelivenesstest-dev-112436-authRole/CognitoIdentityCredentials is not authorized to perform: rekognition:CreateFaceLivenessSession because no identity-based policy allows the rekognition:CreateFaceLivenessSession action
```

Updated the policy since the original one only has the `Start*`

```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"rekognition:StartFaceLivenessSession",
				"rekognition:CreateFaceLivenessSession"
			],
			"Resource": "*"
		}
	]
}
```

Cleared cookies and local storage, logged in again:

Oh shit. I got the liveness screen!

The network tab shows the /create endpoint returned a session! This all of a sudden feels exciting!

clicking "Begin check"...

Browser asks for permissions. Accepting...

Nooo..."Server issue. Cannot complete check due to server issue. [Try again button]"

But I do see myself on the screen.

Oh silly me...In my API route I put `session` instead of `sessionId`.

Testing:

test 1. It timed out after 7 seconds because I was looking at my webcam and not my computer screen.

test 2. I moved too much so it failed.

test3. I clicked try again but the websocket from the previous session was open(?)

test 4. OMG so this would've worked, but in dev, react calls useEffect twice, so my sessionId referred to the first session even though my state updated and gave me a new one.

Calling this good for now. I should probably host this just to make sure. Will update.

## Closing thoughts:

- This was more or less pretty smooth.
- The adding the policy in the console thing still bothers me. also note that the policy in the docs isn't complete.
- As shown in the code above, the AWS docs need to be updated asap to include the `req` being passed to the `getRekognitionClient`.
- Websocket timeouts and retries, and general error handling are something that would trip up any dev trying to do this.
- The Java/python part isn't needed. Atleast, I didn't do it.
- This is ready to be built on and integrated into a real-world app. A few rough edges, but considering everything it's doing, it's kinda crazy I got this all up and running in 90 minutes.
