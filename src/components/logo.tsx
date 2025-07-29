import { TestTube2 } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <TestTube2 className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline">
        VTECHBRIDGE
      </h1>
    </Link>
  );
}
