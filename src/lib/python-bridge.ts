import { spawn } from 'child_process';
import path from 'path';

export interface PythonScraperResult {
  symbol: string;
  startDate: string;
  endDate: string;
  articles: Array<{
    title: string;
    source: string;
    date: string;
    sentiment: string;
    url: string;
  }>;
  analysis: {
    sentiment: string;
    keyTopics: string[];
    confidence: number;
  };
}

export async function callPythonScraper(
  symbol: string, 
  startDate: string, 
  endDate: string
): Promise<PythonScraperResult> {
  return new Promise((resolve, reject) => {
    // Path to your partner's Python script
    // Update this path to match where the script is located
    const pythonScriptPath = path.join(process.cwd(), 'analyzer.py');
    
    console.log('Calling Python script:', pythonScriptPath);
    
    const python = spawn('python', [
      pythonScriptPath,
      '--symbol', symbol,
      '--start-date', startDate,
      '--end-date', endDate
    ]);
    
    let data = '';
    let errorData = '';
    
    python.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    python.stderr.on('data', (chunk) => {
      errorData += chunk.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          reject(new Error('Invalid response from Python script'));
        }
      } else {
        console.error('Python script failed:', errorData);
        reject(new Error(`Python script failed with code ${code}: ${errorData}`));
      }
    });
    
    python.on('error', (error) => {
      console.error('Failed to start Python script:', error);
      reject(new Error('Failed to start Python script'));
    });
  });
}
