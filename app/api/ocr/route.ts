import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60

const EXTRACTION_PROMPT = `You are extracting patient demographic data from an EMR (Electronic Medical Records) screen photo.

Extract the following fields exactly as they appear. If a field is not visible or unclear, return an empty string for that field.

Return ONLY a valid JSON object with these exact keys:
{
  "last_name": "",
  "first_name": "",
  "dob": "",
  "address": "",
  "city": "",
  "state": "",
  "zip": "",
  "home_phone": "",
  "cell_phone": "",
  "insurance": "",
  "policy_member_id": ""
}

Do not include any explanation, markdown, or text outside the JSON object.`

export async function POST(request: NextRequest) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = image.type || 'image/jpeg'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content || ''

    let extracted
    try {
      extracted = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content },
        { status: 422 }
      )
    }

    return NextResponse.json({ data: extracted })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
