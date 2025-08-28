
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { language_id, source_code, stdin } = await req.json();

  if (!language_id || !source_code) {
    return NextResponse.json({ error: 'Language ID and source code are required.' }, { status: 400 });
  }

  const apiKey = process.env.ONLINE_COMPILER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Compiler API key is not configured.' }, { status: 500 });
  }

  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'online-compiler.p.rapidapi.com'
    },
    body: JSON.stringify({
      language_id,
      source_code: source_code,
      stdin: stdin || '',
    })
  };

  try {
    const response = await fetch('https://online-compiler.p.rapidapi.com/submissions?base64_encoded=false&wait=true', options);
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Compiler API Error:', errorData);
        return NextResponse.json({ error: 'Failed to execute code.', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error('Error calling compiler API:', error);
    return NextResponse.json({ error: 'Failed to connect to the compiler service.', details: error.message }, { status: 500 });
  }
}
