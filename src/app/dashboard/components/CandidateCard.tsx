import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CandidateShortlistingOutput } from "@/ai/flows/candidate-shortlisting";
import { Github, Save, Send, Link as LinkIcon, AlertTriangle, CheckCircle, ListChecks } from "lucide-react";
import Link from "next/link";

interface CandidateCardProps extends CandidateShortlistingOutput {
  githubProfileUrl: string;
}

export function CandidateCard({ summary, techStack, flaggedItems, githubProfileUrl }: CandidateCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden w-full bg-card/90 backdrop-blur-sm">
      <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-gradient-primary mb-1">
              Candidate Analysis
            </CardTitle>
            <CardDescription className="text-sm text-foreground/70">
              Insights for <Link href={githubProfileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{githubProfileUrl.split('/').pop()}</Link>
            </CardDescription>
          </div>
          <Link href={githubProfileUrl} target="_blank" rel="noopener noreferrer" passHref>
            <Button variant="outline" size="icon" className="ml-auto flex-shrink-0">
              <Github className="h-5 w-5" />
              <span className="sr-only">View GitHub Profile</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-1 flex items-center"><CheckCircle className="h-5 w-5 mr-2 text-green-500" />Summary</h4>
          <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-foreground mb-2 flex items-center"><ListChecks className="h-5 w-5 mr-2 text-blue-500" />Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {techStack.length > 0 ? techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                {tech}
              </Badge>
            )) : <p className="text-sm text-foreground/60 italic">No specific tech stack identified.</p>}
          </div>
        </div>

        {flaggedItems.length > 0 && (
          <div>
            <h4 className="font-medium text-destructive mb-1 flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />Flagged Items</h4>
            <ul className="list-disc list-inside space-y-1 pl-1">
              {flaggedItems.map((item, index) => (
                <li key={index} className="text-sm text-foreground/80">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
        <Button variant="outline" size="sm">
          <Save className="mr-2 h-4 w-4" /> Save to Pipeline
        </Button>
        <Button size="sm" className="btn-gradient">
          <Send className="mr-2 h-4 w-4" /> Send Message
        </Button>
      </CardFooter>
    </Card>
  );
}
