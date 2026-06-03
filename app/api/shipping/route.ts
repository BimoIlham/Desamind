import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { origin, destination, weight, courier } = await request.json();

    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const apiKey = process.env.BINDERBYTE_API_KEY;
    
    // Attempt actual BinderByte call if API key exists
    if (apiKey) {
      try {
        const res = await fetch(`https://api.binderbyte.com/v1/cost?api_key=${apiKey}&courier=${courier}&origin=${origin}&destination=${destination}&weight=${weight}`);
        const data = await res.json();
        
        if (data && data.status === 200 && data.results) {
           return NextResponse.json(data.results[0].costs);
        }
      } catch (err) {
        console.warn("BinderByte API failed, falling back to mock", err);
      }
    }

    // Fallback Mock Data if BinderByte fails or API key is not ready
    // Provides JNE Reguler mock data
    const mockCosts = [
      {
        service: 'REG',
        description: 'Layanan Reguler',
        cost: [
          {
            value: 15000 + Math.floor(Math.random() * 10000), // Randomize slightly for effect
            etd: '2-3 Hari',
            note: ''
          }
        ]
      },
      {
        service: 'YES',
        description: 'Yakin Esok Sampai',
        cost: [
          {
            value: 25000 + Math.floor(Math.random() * 10000),
            etd: '1 Hari',
            note: ''
          }
        ]
      }
    ];

    return NextResponse.json(mockCosts);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
