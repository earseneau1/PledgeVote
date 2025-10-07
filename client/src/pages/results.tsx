import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { ResultsChart } from "@/components/results-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, User, Users, CheckCircle } from "lucide-react";
import type { Vote as VoteType, User as UserType } from "@shared/schema";

export default function Results() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const voteId = params.id;

  const { data: vote, isLoading: voteLoading } = useQuery<{ vote: VoteType; creator: UserType }>({
    queryKey: [`/api/votes/${voteId}`],
    enabled: !!voteId,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: [`/api/votes/${voteId}/results`],
    enabled: !!voteId,
  });

  const { data: participation } = useQuery<{ totalVotes: number; voters: any[] }>({
    queryKey: [`/api/votes/${voteId}/participation`],
    enabled: !!voteId,
  });

  if (voteLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Vote Not Found</h3>
              <p className="text-muted-foreground mb-4">The vote you're looking for doesn't exist.</p>
              <Button onClick={() => setLocation('/')} data-testid="button-back-home">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const voteData = vote.vote;
  const creator = vote.creator;
  const totalVotes = participation?.totalVotes || 0;
  const participationRate = totalVotes > 0 ? Math.round((totalVotes / 42) * 100) : 0;
  const multipleChoiceOptions = Array.isArray(voteData.options)
    ? (voteData.options as string[])
    : [];

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation('/')} className="mb-4" data-testid="button-back">
            ← Back to Dashboard
          </Button>
        </div>

        {/* Vote Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={voteData.status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                {voteData.status === 'active' ? 'Active' : 'Closed'}
              </Badge>
              <Badge variant="secondary">
                {voteData.type === 'yes_no' ? 'Yes/No' : 
                 voteData.type === 'multiple_choice' ? 'Multiple Choice' : 'Ranked Choice'}
              </Badge>
            </div>
            <CardTitle className="text-2xl" data-testid="text-vote-title">{voteData.title}</CardTitle>
            {voteData.description && (
              <p className="text-muted-foreground mt-2" data-testid="text-vote-description">
                {voteData.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {voteData.status === 'active' ? 
                  `Closes ${new Date(voteData.endDate).toLocaleDateString()}` :
                  `Closed ${new Date(voteData.endDate).toLocaleDateString()}`
                }
              </span>
              <span className="flex items-center gap-1">
                <User size={16} />
                Created by {creator?.firstName} {creator?.lastName}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Participation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-primary" size={24} />
                <span className="text-sm font-medium text-muted-foreground">Total Votes</span>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-votes">{totalVotes}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-success" size={24} />
                <span className="text-sm font-medium text-muted-foreground">Participation Rate</span>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-participation-rate">{participationRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-secondary" size={24} />
                <span className="text-sm font-medium text-muted-foreground">Eligible Members</span>
              </div>
              <p className="text-3xl font-bold text-foreground">42</p>
            </CardContent>
          </Card>
        </div>

        {/* Results Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Vote Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsChart vote={voteData} results={results || []} />
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {results && results.length > 0 ? (
                <div className="space-y-4">
                  {voteData.type === 'yes_no' && (
                    <>
                      {(() => {
                        const yesVotes = results.filter((r: any) => r.choices?.answer === 'yes').length;
                        const noVotes = results.filter((r: any) => r.choices?.answer === 'no').length;
                        const total = yesVotes + noVotes;
                        
                        return (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-success">Yes</span>
                                <span className="font-semibold">{yesVotes} votes ({total > 0 ? Math.round((yesVotes / total) * 100) : 0}%)</span>
                              </div>
                              <Progress value={total > 0 ? (yesVotes / total) * 100 : 0} className="h-3" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-destructive">No</span>
                                <span className="font-semibold">{noVotes} votes ({total > 0 ? Math.round((noVotes / total) * 100) : 0}%)</span>
                              </div>
                              <Progress value={total > 0 ? (noVotes / total) * 100 : 0} className="h-3" />
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                  
                  {voteData.type === 'multiple_choice' && multipleChoiceOptions.length > 0 && (
                    <>
                      {multipleChoiceOptions.map((option: string, index: number) => {
                        const optionVotes = results.filter((r: any) => r.choices?.selectedOption === option).length;
                        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                        
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{option}</span>
                              <span className="font-semibold">{optionVotes} votes ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-3" />
                          </div>
                        );
                      })}
                    </>
                  )}
                  
                  {voteData.type === 'ranked_choice' && (
                    <div className="text-center text-muted-foreground">
                      <p>Ranked choice results calculation coming soon</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No votes have been cast yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Participation List */}
        {participation?.voters && participation.voters.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participation.voters.map((voter: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="font-medium">
                      {voter.firstName} {voter.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(voter.submittedAt).toLocaleDateString()} at {new Date(voter.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
