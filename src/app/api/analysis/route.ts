import { NextRequest, NextResponse } from 'next/server';
import { callPythonScraper } from '@/lib/python-bridge';

export async function POST(request: NextRequest) {
  try {
    const { symbol, startDate, endDate } = await request.json();
    
    console.log('Analysis request:', { symbol, startDate, endDate });
    
    // Call Sami's Python script
    const result = await callPythonScraper(symbol, startDate, endDate);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
