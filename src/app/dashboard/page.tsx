
import { CandidateShortlistingForm } from "./components/CandidateShortlistingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChartHorizontalBig, Filter, Users, Briefcase } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const mockCandidates = [
    { id: 1, name: "Alice Wonderland", stage: "New", summary: "Full-stack dev, React & Node.js expert.", avatar: "https://placehold.co/40x40.png?text=AW", aiHint: "woman avatar" },
    { id: 2, name: "Bob The Builder", stage: "Contacted", summary: "Frontend specialist, Vue.js enthusiast.", avatar: "https://placehold.co/40x40.png?text=BB", aiHint: "man avatar" },
    { id: 3, name: "Charlie Brown", stage: "Interviewed", summary: "Backend engineer, Python & Django.", avatar: "https://placehold.co/40x40.png?text=CB", aiHint: "person avatar" },
  ];

  return (
    <div className="py-8 md:py-12 bg-secondary/30 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 flex items-center">
             <Briefcase className="h-10 w-10 mr-3 text-primary"/>
            Recruiter <span className="text-gradient-primary ml-2">Dashboard</span>
          </h1>
          <p className="text-lg text-foreground/70">Manage your candidates and hiring pipeline efficiently.</p>
        </header>

        <CandidateShortlistingForm />

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
              {/* Add TabsContent for other stages if needed */}
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg overflow-hidden glassmorphic">
          <CardHeader>
             <CardTitle className="text-2xl font-semibold flex items-center"><BarChartHorizontalBig className="h-6 w-6 mr-2 text-primary" />Hiring Analytics (Mock)</CardTitle>
            <CardDescription>Visualize your recruitment performance.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
             <Image src="https://placehold.co/600x300.png" alt="Mock hiring analytics chart" width={600} height={300} className="rounded-md opacity-70" data-ai-hint="chart graph data" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
