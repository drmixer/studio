"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, MapPin, Phone, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. We'll get back to you soon.",
      variant: "default", 
    });
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4">
            Get In <span className="text-gradient-primary">Touch</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Have questions or want to collaborate? We&apos;d love to hear from you.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start">
          <Card className="shadow-xl overflow-hidden animate-slide-up glassmorphic">
             <div className="h-2 bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Send us a message</CardTitle>
              <CardDescription>Fill out the form and our team will get back to you shortly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Inquiry about GitTalent" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." rows={5} required />
                </div>
                <Button type="submit" className="w-full btn-gradient shadow-md hover:shadow-lg transition-shadow flex items-center gap-2" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : <>Send Message <Send className="h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8 animate-slide-up animation-delay-300 opacity-0" style={{animationDelay: '0.3s'}}>
            <h2 className="text-2xl font-semibold text-foreground">Contact Information</h2>
            <p className="text-foreground/80">
              Alternatively, you can reach us through the following channels:
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Our Office</h3>
                  <p className="text-foreground/70">123 Tech Avenue, Silicon Valley, CA 94000</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Email Us</h3>
                  <a href="mailto:info@gittalent.com" className="text-foreground/70 hover:text-primary transition-colors">info@gittalent.com</a>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Call Us</h3>
                  <a href="tel:+1234567890" className="text-foreground/70 hover:text-primary transition-colors">+1 (234) 567-890</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
