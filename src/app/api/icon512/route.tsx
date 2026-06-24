import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 260,
          backgroundImage: 'linear-gradient(to bottom, #042A2B, #2e7d32)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          borderRadius: '20%',
          fontFamily: 'sans-serif',
        }}
      >
        GB
      </div>
    ),
    { width: 512, height: 512 }
  );
}
