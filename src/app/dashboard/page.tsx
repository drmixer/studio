
"use client";

import { useEffect, useState, type FormEvent } from 'react';
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
import { suggestProfileEnhancements, type SuggestProfileEnhancementsOutput } from "@/ai/flows/suggest-profile-enhancements-flow";
import { CandidateCard } from "./components/CandidateCard";

interface Project {
  id: string;
  title: string;
  url: string;
  description?: string;
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


  useEffect(() => {
    console.log("DashboardPage: useEffect triggered. Loading:", loading, "User:", user ? user.id : null);
    if (!loading && !user) {
      console.log("DashboardPage: Not loading and no user, redirecting to /auth.");
      router.replace('/auth');
    }
    if (user) {
      console.log("DashboardPage: User detected, setting profile form states.");
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
    toast({ title: "Generating Profile Suggestions...", description: "AI is analyzing your GitHub profile. This may take a moment." });
    try {
      const { bioSuggestion, skillSuggestions } = await suggestProfileEnhancements({ githubProfileUrl: user.githubProfileUrl });
      setBio(bioSuggestion); // Update bio state, user can then save it
      toast({ 
        title: "AI Suggestions Ready!", 
        description: "Bio updated with suggestion. Check console for skill suggestions. Remember to save your bio!",
        duration: 7000 
      });
      console.log("AI Skill Suggestions:", skillSuggestions);
      // For a more advanced UI, you could display these skillSuggestions and allow the user to add them one by one.
      // For now, we'll update the bio and log skills. User can save bio and manually add skills.
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
    const newSkills = [...new Set([...skills, currentSkill.trim()])]; // Ensure unique skills
    setSkills(newSkills); 
    setCurrentSkill("");
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile({ skills: newSkills });
      toast({ title: "Skill Added", description: `${currentSkill.trim()} has been added to your skills.` });
    } catch (error) {
      setSkills(skills.filter(s => s !== currentSkill.trim())); // Revert on error
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
      setSkills(oldSkills); 
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
      setProjects(projects.filter(p => p.id !== newProject.id)); 
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
      setProjects(oldProjects); 
      toast({ title: "Update Failed", description: "Could not remove project. Please try again.", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const mockCandidates = [
    { id: 1, name: "Alice Wonderland", stage: "New", summary: "Full-stack dev, React & Node.js expert.", avatar: "https://placehold.co/40x40.png?text=AW", aiHint: "woman avatar" },
    { id: 2, name: "Bob The Builder", stage: "Contacted", summary: "Frontend specialist, Vue.js enthusiast.", avatar: "https://placehold.co/40x40.png?text=BB", aiHint: "man avatar" },
    { id: 3, name: "Charlie Brown", stage: "Interviewed", summary: "Backend engineer, Python & Django.", avatar: "https://placehold.co/40x40.png?text=CB", aiHint: "person avatar" },
  ];

  if (loading || !user) {
    console.log("DashboardPage: Rendering Loader2. Loading state:", loading, "User:", user ? user.id : null);
    return (
      <div className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.32))] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const combinedLoading = loading || isLinkingGithub || isAnalyzingSelf || isUpdatingProfile || isSuggestingProfile;

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
                <Input placeholder="Search candidates..." className="max-w-xs" />
                <Select>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />More Filters</Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="contacted">Contacted</TabsTrigger>
                  <TabsTrigger value="interviewed">Interviewed</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <div className="space-y-4">
                    {mockCandidates.map(candidate => (
                      <Card key={candidate.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow bg-card/80">
                        <div className="flex items-center space-x-3">
                          <Image src={candidate.avatar} alt={candidate.name} width={40} height={40} className="rounded-full" data-ai-hint={candidate.aiHint} />
                          <div>
                            <p className="font-medium text-foreground">{candidate.name}</p>
                            <p className="text-xs text-foreground/70">{candidate.summary}</p>
                          </div>
                        </div>
                        <Badge variant={candidate.stage === 'New' ? 'default' : candidate.stage === 'Contacted' ? 'secondary' : 'outline'}
                         className={candidate.stage === 'New' ? 'bg-primary/10 text-primary border-primary/20' : 
                                    candidate.stage === 'Contacted' ? 'bg-accent/10 text-accent border-accent/20' : 
                                    'bg-green-500/10 text-green-600 border-green-500/20'}>
                          {candidate.stage}
                        </Badge>
                      </Card>
                    ))}
                  </div>
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

