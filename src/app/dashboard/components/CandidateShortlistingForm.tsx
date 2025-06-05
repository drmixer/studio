"use client";

import { useState, type FormEvent } from "react";
import { candidateShortlisting, type CandidateShortlistingOutput, type CandidateShortlistingInput } from "@/ai/flows/candidate-shortlisting";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CandidateCard } from "./CandidateCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CandidateShortlistingForm() {
  const [githubProfileUrl, setGithubProfileUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CandidateShortlistingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    if (!githubProfileUrl.trim()) {
      setError("GitHub Profile URL cannot be empty.");
      setIsLoading(false);
      toast({ title: "Validation Error", description: "GitHub Profile URL cannot be empty.", variant: "destructive" });
      return;
    }
    
    // Basic URL validation
    try {
      new URL(githubProfileUrl);
      if (!githubProfileUrl.includes("github.com")) {
        throw new Error("Invalid GitHub URL pattern.");
      }
    } catch (_) {
      setError("Please enter a valid GitHub Profile URL (e.g., https://github.com/username).");
      setIsLoading(false);
      toast({ title: "Invalid URL", description: "Please enter a valid GitHub Profile URL.", variant: "destructive" });
      return;
    }


    try {
      const input: CandidateShortlistingInput = { githubProfileUrl };
      const output = await candidateShortlisting(input);
      setResult(output);
    } catch (e: any) {
      console.error("Error shortlisting candidate:", e);
      const errorMessage = e.message || "Failed to analyze profile. Please try again.";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden glassmorphic">
        <div className="h-2 bg-gradient-to-r from-primary to-accent" />
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">AI Candidate Shortlisting</CardTitle>
          <CardDescription>Enter a GitHub profile URL to get an AI-powered analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="githubUrl" className="text-sm font-medium">GitHub Profile URL</Label>
              <Input
                id="githubUrl"
                type="url"
                value={githubProfileUrl}
                onChange={(e) => setGithubProfileUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="mt-1"
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto btn-gradient shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Analysis Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && !isLoading && (
        <div className="animate-fade-in">
          <CandidateCard {...result} githubProfileUrl={githubProfileUrl} />
        </div>
      )}
    </div>
  );
}
