import { TestTube2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <TestTube2 className="h-7 w-7 text-primary" />
      <h1 className="text-2xl font-bold font-headline text-slate-800 dark:text-slate-200">
        VTECHBRIDGE
      </h1>
    </div>
  );
}
