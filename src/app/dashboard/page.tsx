
"use client";

import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/contexts/AuthContext';
import { CandidateShortlistingForm } from "./components/CandidateShortlistingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChartHorizontalBig, Filter, Users, Briefcase, Loader2, Github, Link as LinkIcon, Bot, Trash2, PlusCircle, BriefcaseBusiness, Lightbulb, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { candidateShortlisting, type CandidateShortlistingOutput } from "@/ai/flows/candidate-shortlisting";
import { suggestProfileEnhancements, type SuggestProfileEnhancementsInput, type SuggestProfileEnhancementsOutput } from "@/ai/flows/suggest-profile-enhancements-flow";
import { CandidateCard } from "./components/CandidateCard";

interface Project {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface MockCandidate {
  id: number;
  name: string;
  stage: "New" | "Contacted" | "Interviewed" | "Offer" | "Hired";
  summary: string;
  avatar: string;
  aiHint: string;
  languages: string[];
  profileUrl?: string;
}

export default function DashboardPage() {
  const { user, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // GitHub Profile States
  const [githubUrl, setGithubUrl] = useState(user?.githubProfileUrl || "");
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [selfAnalysisResult, setSelfAnalysisResult] = useState<CandidateShortlistingOutput | null>(null);
  const [isAnalyzingSelf, setIsAnalyzingSelf] = useState(false);
  const [selfAnalysisError, setSelfAnalysisError] = useState<string | null>(null);

  // Developer Profile States
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [currentSkill, setCurrentSkill] = useState("");
  const [projects, setProjects] = useState<Project[]>(user?.projects || []);
  const [currentProject, setCurrentProject] = useState<{title: string, url: string, description: string}>({title: "", url: "", description: ""});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSuggestingProfile, setIsSuggestingProfile] = useState(false);

  // Recruiter Pipeline States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");

  const mockCandidatesData: MockCandidate[] = useMemo(() => [
    { id: 1, name: "Alice Wonderland", stage: "New", summary: "Full-stack dev, React & Node.js expert.", avatar: "https://placehold.co/40x40.png?text=AW", aiHint: "woman avatar", languages: ["JavaScript", "React", "Node.js", "TypeScript"], profileUrl: "https://github.com/alice" },
    { id: 2, name: "Bob The Builder", stage: "Contacted", summary: "Frontend specialist, Vue.js enthusiast.", avatar: "https://placehold.co/40x40.png?text=BB", aiHint: "man avatar", languages: ["JavaScript", "Vue.js", "HTML", "CSS"], profileUrl: "https://github.com/bob" },
    { id: 3, name: "Charlie Brown", stage: "Interviewed", summary: "Backend engineer, Python & Django.", avatar: "https://placehold.co/40x40.png?text=CB", aiHint: "person avatar", languages: ["Python", "Django", "SQL"], profileUrl: "https://github.com/charlie" },
    { id: 4, name: "Diana Prince", stage: "New", summary: "DevOps engineer, AWS & Kubernetes expert.", avatar: "https://placehold.co/40x40.png?text=DP", aiHint: "woman hero", languages: ["Python", "Shell", "Docker", "Kubernetes", "AWS"], profileUrl: "https://github.com/diana" },
    { id: 5, name: "Edward Elric", stage: "Offer", summary: "Mobile developer, Swift & Kotlin.", avatar: "https://placehold.co/40x40.png?text=EE", aiHint: "anime character", languages: ["Swift", "Kotlin", "Java"], profileUrl: "https://github.com/edward" },
    { id: 6, name: "Fiona Gallagher", stage: "Hired", summary: "Data Scientist, proficient in R and Python.", avatar: "https://placehold.co/40x40.png?text=FG", aiHint: "woman profile", languages: ["Python", "R", "SQL", "Pandas"], profileUrl: "https://github.com/fiona" },
  ], []);

  const availableLanguages = useMemo(() => {
    const allLangs = new Set<string>();
    mockCandidatesData.forEach(candidate => {
      candidate.languages.forEach(lang => allLangs.add(lang));
    });
    return Array.from(allLangs).sort();
  }, [mockCandidatesData]);

  const filteredCandidates = useMemo(() => {
    return mockCandidatesData.filter(candidate => {
      const matchesSearchTerm = searchTerm.toLowerCase() === "" ||
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.summary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLanguage = selectedLanguage === "all" ||
        candidate.languages.map(l => l.toLowerCase()).includes(selectedLanguage.toLowerCase());

      const matchesStage = selectedStage === "all" ||
        candidate.stage.toLowerCase() === selectedStage.toLowerCase();

      return matchesSearchTerm && matchesLanguage && matchesStage;
    });
  }, [mockCandidatesData, searchTerm, selectedLanguage, selectedStage]);


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
    if (user) {
      setGithubUrl(user.githubProfileUrl || "");
      setBio(user.bio || "");
      setSkills(user.skills || []);
      setProjects(user.projects || []);
    }
  }, [user, loading, router]);

  const handleLinkGitHub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || user.role !== 'developer') return;

    if (!githubUrl.trim()) {
      toast({ title: "GitHub URL Needed", description: "Please enter your GitHub profile URL.", variant: "destructive" });
      return;
    }
    try {
      new URL(githubUrl);
      if (!githubUrl.includes("github.com")) {
        throw new Error("Invalid GitHub URL pattern.");
      }
    } catch (_) {
      toast({ title: "Invalid URL", description: "Please enter a valid GitHub Profile URL (e.g., https://github.com/username).", variant: "destructive"});
      return;
    }

    setIsLinkingGithub(true);
    try {
      await updateUserProfile({ githubProfileUrl: githubUrl });
      toast({
        title: "GitHub Profile Linked!",
        description: "Your GitHub profile URL has been saved.",
      });
      setSelfAnalysisResult(null);
      setSelfAnalysisError(null);
    } catch (error) {
      toast({
        title: "Linking Failed",
        description: "Could not save your GitHub profile URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLinkingGithub(false);
    }
  };

  const handleAnalyzeSelfProfile = async () => {
    if (!user?.githubProfileUrl) {
      toast({ title: "No GitHub Profile Linked", description: "Please link your GitHub profile first.", variant: "destructive" });
      return;
    }
    setIsAnalyzingSelf(true);
    setSelfAnalysisResult(null);
    setSelfAnalysisError(null);
    toast({ title: "Analyzing Your Profile...", description: "This may take a moment." });

    try {
      const output = await candidateShortlisting({ githubProfileUrl: user.githubProfileUrl });
      setSelfAnalysisResult(output);
      toast({ title: "Analysis Complete!", description: "Your GitHub profile analysis is ready." });
    } catch (e: any) {
      const errorMessage = e.message || "Failed to analyze your profile. Please try again.";
      setSelfAnalysisError(errorMessage);
      toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAnalyzingSelf(false);
    }
  };

  const handleSuggestProfileEnhancements = async () => {
    if (!user?.githubProfileUrl) {
      toast({ title: "No GitHub Profile Linked", description: "Please link your GitHub profile first to get AI suggestions.", variant: "destructive" });
      return;
    }
    setIsSuggestingProfile(true);
    toast({ title: "Generating Profile Suggestions...", description: "AI is analyzing your profile. This may take a moment." });

    const flowInput: SuggestProfileEnhancementsInput = {
      githubProfileUrl: user.githubProfileUrl,
      dashboardSkills: skills.length > 0 ? skills : undefined,
      dashboardProjects: projects.length > 0 ? projects.map(p => ({ title: p.title, description: p.description })) : undefined,
    };

    try {
      const { bioSuggestion, skillSuggestions } = await suggestProfileEnhancements(flowInput);

      if (bioSuggestion) {
         if (bioSuggestion.toLowerCase().includes("tool error: tool_error:") || bioSuggestion.toLowerCase().includes("could not generate a bio suggestion")) {
            toast({
                title: "AI Bio Suggestion",
                description: bioSuggestion,
                duration: 7000
            });
         } else {
            setBio(bioSuggestion);
            toast({
                title: "AI Bio Suggestion Ready!",
                description: "Bio updated with AI suggestion. Review and save it.",
                duration: 7000
            });
         }
      }

      if (skillSuggestions && skillSuggestions.length > 0) {
        console.log("AI Skill Suggestions (from GitHub & Dashboard):", skillSuggestions);
        toast({
          title: "AI Skill Suggestions",
          description: "Check your browser's console for skill suggestions from AI.",
          duration: 7000
        });
      } else if (skillSuggestions) {
        console.log("AI did not suggest any specific skills or skill suggestions were empty.");
         toast({
          title: "AI Skill Suggestions",
          description: "AI did not find specific new skills to suggest based on the available information.",
          duration: 7000
        });
      }

    } catch (e: any) {
      const errorMessage = e.message || "Failed to get AI suggestions. Please try again.";
      toast({ title: "Suggestion Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSuggestingProfile(false);
    }
  };


  const handleSaveBio = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ bio });
      toast({ title: "Bio Updated", description: "Your professional summary has been saved." });
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not save your bio. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddSkill = async () => {
    if (!user || !currentSkill.trim()) return;
    const skillToAdd = currentSkill.trim();
    const newSkills = [...new Set([...skills, skillToAdd])];
    setSkills(newSkills);
    setCurrentSkill("");
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ skills: newSkills });
      toast({ title: "Skill Added", description: `${skillToAdd} has been added to your skills.` });
    } catch (error) {
      setSkills(skills.filter(s => s !== skillToAdd)); // Revert on error
      toast({ title: "Update Failed", description: "Could not add skill. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!user) return;
    const oldSkills = [...skills];
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ skills: newSkills });
      toast({ title: "Skill Removed", description: `${skillToRemove} has been removed from your skills.` });
    } catch (error) {
      setSkills(oldSkills); // Revert on error
      toast({ title: "Update Failed", description: "Could not remove skill. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !currentProject.title.trim() || !currentProject.url.trim()) {
      toast({ title: "Missing Information", description: "Project title and URL are required.", variant: "destructive"});
      return;
    }
    try {
        new URL(currentProject.url);
    } catch (_) {
        toast({ title: "Invalid URL", description: "Please enter a valid URL for your project.", variant: "destructive"});
        return;
    }

    const newProject: Project = { ...currentProject, id: Date.now().toString() };
    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    setCurrentProject({title: "", url: "", description: ""});
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ projects: newProjects });
      toast({ title: "Project Added", description: `${newProject.title} has been added to your portfolio.` });
    } catch (error) {
      setProjects(projects.filter(p => p.id !== newProject.id)); // Revert on error
      toast({ title: "Update Failed", description: "Could not add project. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRemoveProject = async (projectIdToRemove: string) => {
    if (!user) return;
    const oldProjects = [...projects];
    const newProjects = projects.filter(project => project.id !== projectIdToRemove);
    setProjects(newProjects);
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ projects: newProjects });
      const removedProject = oldProjects.find(p => p.id === projectIdToRemove);
      toast({ title: "Project Removed", description: `${removedProject?.title || 'Project'} has been removed.` });
    } catch (error) {
      setProjects(oldProjects); // Revert on error
      toast({ title: "Update Failed", description: "Could not remove project. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.32))] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const combinedLoading = loading || isLinkingGithub || isAnalyzingSelf || isUpdatingProfile || isSuggestingProfile;
  const stageTabs: (MockCandidate["stage"] | "all")[] = ["all", "New", "Contacted", "Interviewed", "Offer", "Hired"];


  return (
    <div className="py-8 md:py-12 bg-secondary/30 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 flex items-center">
             <Briefcase className="h-10 w-10 mr-3 text-primary"/>
            {user.role === 'recruiter' ? "Recruiter" : "Developer"} <span className="text-gradient-primary ml-2">Dashboard</span>
          </h1>
          <p className="text-lg text-foreground/70">Welcome, {user.email}! Manage your activities efficiently.</p>
        </header>

        {user.role === 'recruiter' && <CandidateShortlistingForm />}

        {user.role === 'recruiter' && (
          <Card className="shadow-lg overflow-hidden glassmorphic">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center"><Users className="h-6 w-6 mr-2 text-primary" /> Candidate Pipeline</CardTitle>
              <CardDescription>Track candidates through your hiring stages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search candidates by name or summary..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {availableLanguages.map(lang => (
                      <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />More Filters</Button>
              </div>

              <Tabs value={selectedStage} onValueChange={setSelectedStage} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
                   {stageTabs.map(stage => (
                    <TabsTrigger key={stage} value={stage.toLowerCase()}>{stage}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={selectedStage.toLowerCase()}>
                  {filteredCandidates.length > 0 ? (
                    <div className="space-y-4">
                      {filteredCandidates.map(candidate => (
                        <Card key={candidate.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-md transition-shadow bg-card/80">
                          <div className="flex items-start sm:items-center space-x-3 mb-2 sm:mb-0">
                            <Image src={candidate.avatar} alt={candidate.name} width={40} height={40} className="rounded-full" data-ai-hint={candidate.aiHint} />
                            <div>
                              <p className="font-medium text-foreground">{candidate.name}</p>
                              <p className="text-xs text-foreground/70">{candidate.summary}</p>
                              {candidate.profileUrl && (
                                <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
                                  <Github className="h-3 w-3 mr-1" /> View Profile
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                            <Badge
                               variant="secondary"
                               className={`capitalize ${
                                 candidate.stage === 'New' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                 candidate.stage === 'Contacted' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                 candidate.stage === 'Interviewed' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                                 candidate.stage === 'Offer' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                 candidate.stage === 'Hired' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' :
                                 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                               }`}
                              >
                                {candidate.stage}
                            </Badge>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {candidate.languages.slice(0, 3).map(lang => (
                                    <Badge key={lang} variant="secondary" className="text-xs bg-muted/50 text-muted-foreground/80">{lang}</Badge>
                                ))}
                                {candidate.languages.length > 3 && <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground/80">+{candidate.languages.length - 3}</Badge>}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-foreground/70 py-8">No candidates match the current filters.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {user.role === 'developer' && (
          <div className="space-y-8">
            <Card className="shadow-lg overflow-hidden glassmorphic">
              <CardHeader>
                  <CardTitle className="text-2xl font-semibold flex items-center"><Github className="h-6 w-6 mr-2 text-primary" /> Your GitHub Profile</CardTitle>
                  <CardDescription>Link your GitHub to showcase your work and get AI-powered insights.</CardDescription>
              </CardHeader>
              <CardContent>
                  <form onSubmit={handleLinkGitHub} className="space-y-4">
                    <div>
                      <Label htmlFor="github-profile-url">GitHub Profile URL</Label>
                      <Input
                        id="github-profile-url"
                        type="url"
                        placeholder="https://github.com/yourusername"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="mt-1"
                        disabled={combinedLoading}
                      />
                    </div>
                    {user.githubProfileUrl && (
                      <p className="text-sm text-muted-foreground">
                        Current linked profile: <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.githubProfileUrl}</a>
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                        <Button type="submit" className="btn-gradient" disabled={combinedLoading}>
                        {isLinkingGithub ? <Loader2 className="animate-spin mr-2" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                        {user.githubProfileUrl ? "Update GitHub Profile" : "Link GitHub Profile"}
                        </Button>
                        {user.githubProfileUrl && (
                        <Button type="button" variant="outline" onClick={handleAnalyzeSelfProfile} disabled={combinedLoading}>
                            {isAnalyzingSelf ? <Loader2 className="animate-spin mr-2" /> : <Bot className="mr-2 h-4 w-4" />}
                            Analyze My Profile
                        </Button>
                        )}
                        {user.githubProfileUrl && (
                          <Button type="button" variant="outline" onClick={handleSuggestProfileEnhancements} disabled={combinedLoading}>
                            {isSuggestingProfile ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            AI: Suggest Bio & Skills
                          </Button>
                        )}
                    </div>
                  </form>
                  <p className="mt-6 text-sm text-muted-foreground">
                    Linking your GitHub profile allows GitTalent to showcase your projects, contributions, and skills to potential recruiters and get an AI analysis of your public profile. AI suggestions can help you craft a compelling profile.
                  </p>
              </CardContent>
            </Card>

            {selfAnalysisError && !isAnalyzingSelf && (
              <Card className="border-destructive bg-destructive/10">
                <CardHeader>
                  <CardTitle className="text-destructive text-lg">Profile Analysis Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive">{selfAnalysisError}</p>
                </CardContent>
              </Card>
            )}

            {selfAnalysisResult && !isAnalyzingSelf && user.githubProfileUrl && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold mb-4 text-gradient-primary">Your GitHub Profile Analysis</h3>
                <CandidateCard {...selfAnalysisResult} githubProfileUrl={user.githubProfileUrl} showRecruiterActions={false} />
              </div>
            )}

            <Card className="shadow-lg overflow-hidden glassmorphic">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center"><Sparkles className="h-5 w-5 mr-2 text-primary" /> Professional Summary</CardTitle>
                <CardDescription>Craft a compelling bio to introduce yourself. Use the "AI: Suggest Bio & Skills" button above for help!</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="mb-4"
                  disabled={combinedLoading}
                />
                <Button onClick={handleSaveBio} disabled={combinedLoading || (bio === user.bio && !isSuggestingProfile)} className="btn-gradient">
                  {isUpdatingProfile && bio === user.bio && !isSuggestingProfile ? <Loader2 className="animate-spin mr-2" /> : null} Save Bio
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg overflow-hidden glassmorphic">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center"><Lightbulb className="h-5 w-5 mr-2 text-primary" /> Skills & Expertise</CardTitle>
                <CardDescription>Highlight your technical skills. AI suggestions based on your GitHub can appear in your browser's console.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Add a skill (e.g., React)"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !combinedLoading && currentSkill.trim() && handleAddSkill()}
                    disabled={combinedLoading}
                  />
                  <Button onClick={handleAddSkill} disabled={combinedLoading || !currentSkill.trim()} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                  </Button>
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-sm py-1 px-3">
                        {skill}
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-2 p-0 text-primary/70 hover:text-destructive" onClick={() => handleRemoveSkill(skill)} disabled={combinedLoading}>
                           <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic">No skills added yet. Link GitHub and use AI suggestions, or add them manually!</p>}
              </CardContent>
            </Card>

            <Card className="shadow-lg overflow-hidden glassmorphic">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center"><BriefcaseBusiness className="h-5 w-5 mr-2 text-primary" /> Project Showcase</CardTitle>
                <CardDescription>Showcase your best projects and contributions.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProject} className="space-y-4 mb-6 p-4 border rounded-md bg-card/50">
                  <h4 className="font-medium">Add New Project</h4>
                  <div>
                    <Label htmlFor="projectTitle">Project Title</Label>
                    <Input id="projectTitle" value={currentProject.title} onChange={(e) => setCurrentProject({...currentProject, title: e.target.value})} placeholder="Awesome Project Name" disabled={combinedLoading} required/>
                  </div>
                  <div>
                    <Label htmlFor="projectUrl">Project URL</Label>
                    <Input id="projectUrl" type="url" value={currentProject.url} onChange={(e) => setCurrentProject({...currentProject, url: e.target.value})} placeholder="https://github.com/your/project" disabled={combinedLoading} required/>
                  </div>
                  <div>
                    <Label htmlFor="projectDescription">Description (Optional)</Label>
                    <Textarea id="projectDescription" value={currentProject.description} onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})} placeholder="A brief description of your project" disabled={combinedLoading}/>
                  </div>
                  <Button type="submit" disabled={combinedLoading || !currentProject.title.trim() || !currentProject.url.trim()} className="btn-gradient">
                     <PlusCircle className="mr-2 h-4 w-4" /> Add Project
                  </Button>
                </form>

                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map(project => (
                      <Card key={project.id} className="p-4 bg-card/70">
                        <div className="flex justify-between items-start">
                           <div>
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary hover:underline">{project.title}</a>
                            {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive" onClick={() => handleRemoveProject(project.id)} disabled={combinedLoading}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove project</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground italic text-center">No projects added yet. Showcase your work!</p>}
              </CardContent>
            </Card>

          </div>
        )}

        {user.role === 'recruiter' && (
          <Card className="shadow-lg overflow-hidden glassmorphic">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center"><BarChartHorizontalBig className="h-6 w-6 mr-2 text-primary" />Hiring Analytics (Mock)</CardTitle>
              <CardDescription>Visualize your recruitment performance.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <Image src="https://placehold.co/600x300.png" alt="Mock hiring analytics chart" width={600} height={300} className="rounded-md opacity-70" data-ai-hint="chart graph data" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
