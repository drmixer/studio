import Link from 'next/link';
import { Briefcase } from 'lucide-react'; // Using Briefcase as a placeholder

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2 group">
      <span className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg text-primary-foreground group-hover:shadow-lg transition-shadow duration-300">
        <Briefcase size={24} />
      </span>
      <h1 className="text-2xl font-bold font-headline text-gradient-primary group-hover:opacity-80 transition-opacity">
        GitTalent
      </h1>
    </Link>
  );
}
