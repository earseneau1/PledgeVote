import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Clock, User, CheckCircle, XCircle } from "lucide-react";
import type { Vote as VoteType, UserVote, User as UserType } from "@shared/schema";

export default function VoteSession() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [rankedChoices, setRankedChoices] = useState<string[]>([]);

  const voteId = params.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: vote, isLoading: voteLoading, error: voteError } = useQuery<{ vote: VoteType; creator: UserType }>({
    queryKey: [`/api/votes/${voteId}`],
    enabled: !!voteId && isAuthenticated,
  });

  const { data: userVote } = useQuery<UserVote>({
    queryKey: [`/api/votes/${voteId}/my-vote`],
    enabled: !!voteId && isAuthenticated,
  });

  const { data: participation } = useQuery<{ totalVotes: number; voters: any[] }>({
    queryKey: [`/api/votes/${voteId}/participation`],
    enabled: !!voteId && isAuthenticated,
  });

  const submitVoteMutation = useMutation({
    mutationFn: async (choices: any) => {
      return await apiRequest('POST', `/api/votes/${voteId}/vote`, { choices });
    },
    onSuccess: () => {
      toast({
        title: "Vote Submitted",
        description: "Your vote has been recorded successfully.",
      });
      setLocation(`/results/${voteId}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  if (isLoading || voteLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading vote...</p>
          </div>
        </div>
      </div>
    );
  }

  if (voteError) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <XCircle className="mx-auto mb-4 text-destructive" size={48} />
              <h3 className="text-lg font-semibold text-foreground mb-2">Vote Not Found</h3>
              <p className="text-muted-foreground mb-4">The vote you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => setLocation('/')} data-testid="button-back-home">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!vote) return null;

  const voteData = vote.vote;
  const creator = vote.creator;

  // Check if user has already voted
  if (userVote) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="mx-auto mb-4 text-success" size={48} />
              <h3 className="text-lg font-semibold text-foreground mb-2">Vote Already Submitted</h3>
              <p className="text-muted-foreground mb-4">You have already voted on this item.</p>
              <Button onClick={() => setLocation(`/results/${voteId}`)} data-testid="button-view-results">
                View Results
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleSubmitVote = () => {
    let choices;

    switch (voteData.type) {
      case 'yes_no':
        if (!selectedChoice) {
          toast({
            title: "Error",
            description: "Please make a selection before submitting.",
            variant: "destructive",
          });
          return;
        }
        choices = { answer: selectedChoice };
        break;
      case 'multiple_choice':
        if (!selectedChoice) {
          toast({
            title: "Error",
            description: "Please select an option before submitting.",
            variant: "destructive",
          });
          return;
        }
        choices = { selectedOption: selectedChoice };
        break;
      case 'ranked_choice':
        if (rankedChoices.length === 0) {
          toast({
            title: "Error",
            description: "Please rank at least one option before submitting.",
            variant: "destructive",
          });
          return;
        }
        choices = { ranking: rankedChoices };
        break;
      default:
        return;
    }

    submitVoteMutation.mutate(choices);
  };

  const renderVotingInterface = () => {
    switch (voteData.type) {
      case 'yes_no':
        return (
          <div className="space-y-4">
            <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice}>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="flex-1 cursor-pointer flex items-center gap-2">
                  <CheckCircle className="text-success" size={20} />
                  <span className="font-medium">Yes</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="flex-1 cursor-pointer flex items-center gap-2">
                  <XCircle className="text-destructive" size={20} />
                  <span className="font-medium">No</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <RadioGroup value={selectedChoice} onValueChange={setSelectedChoice}>
              {(voteData.options as string[] || []).map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'ranked_choice':
        // Simplified ranked choice - just show options for now
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Click options in order of preference (first choice will be ranked highest):
            </p>
            <div className="space-y-2">
              {(voteData.options as string[] || []).map((option: string, index: number) => {
                const isSelected = rankedChoices.includes(option);
                const rank = rankedChoices.indexOf(option) + 1;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setRankedChoices(rankedChoices.filter(choice => choice !== option));
                      } else {
                        setRankedChoices([...rankedChoices, option]);
                      }
                    }}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground">#{rank}</Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const totalVotes = participation?.totalVotes || 0;
  const participationRate = totalVotes > 0 ? Math.round((totalVotes / 42) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setLocation('/')} className="mb-4" data-testid="button-back">
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Active
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
                Closes {new Date(voteData.endDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <User size={16} />
                Created by {creator?.firstName} {creator?.lastName}
              </span>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Participation Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Current Participation</span>
                <span className="text-sm font-semibold text-foreground">
                  {totalVotes} / 42 members
                </span>
              </div>
              <Progress value={participationRate} className="h-2" />
            </div>

            {/* Voting Interface */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Cast Your Vote</h3>
              {renderVotingInterface()}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setLocation('/')} data-testid="button-cancel-vote">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVote}
                disabled={submitVoteMutation.isPending}
                className="bg-primary text-primary-foreground"
                data-testid="button-submit-vote"
              >
                {submitVoteMutation.isPending ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Submit Vote
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
