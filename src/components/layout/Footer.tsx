import Link from 'next/link';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Mail, href: 'mailto:info@gittalent.com', label: 'Email' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-foreground/70">
              Recruiting top talent. One commit at a time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-sm text-foreground/70 hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/contact" className="text-sm text-foreground/70 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-foreground/70 hover:text-primary transition-colors"
                >
                  <link.icon size={24} />
                </a>
              ))}
            </div>
            <p className="text-sm text-foreground/70 mt-4">
              123 Tech Avenue, Silicon Valley, CA 94000
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-foreground/60">
          &copy; {new Date().getFullYear()} GitTalent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
