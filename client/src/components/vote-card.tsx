import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Clock, User, CheckCircle, XCircle, Hash } from "lucide-react";
import type { Vote as VoteType, UserVote } from "@shared/schema";

interface VoteCardProps {
  vote: VoteType & { creator?: { firstName?: string; lastName?: string } };
}

export function VoteCard({ vote }: VoteCardProps) {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState('');

  const { data: userVote } = useQuery<UserVote>({
    queryKey: [`/api/votes/${vote.id}/my-vote`],
    enabled: !!vote.id,
  });

  const { data: participation } = useQuery<{ totalVotes: number; voters: any[] }>({
    queryKey: [`/api/votes/${vote.id}/participation`],
    enabled: !!vote.id,
  });

  const { data: results } = useQuery<any[]>({
    queryKey: [`/api/votes/${vote.id}/results`],
    enabled: !!vote.id && !!vote.allowRealTimeResults,
  });

  // Calculate time remaining
  useState(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const endDate = new Date(vote.endDate);
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Closed');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeRemaining(`${days} day${days > 1 ? 's' : ''}`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours} hour${hours > 1 ? 's' : ''}`);
        } else {
          setTimeRemaining('Less than 1 hour');
        }
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  });

  const hasVoted = !!userVote;
  const totalVotes = participation?.totalVotes || 0;
  const participationRate = totalVotes > 0 ? Math.round((totalVotes / 42) * 100) : 0; // TODO: Get actual member count

  const getVoteTypeIcon = () => {
    switch (vote.type) {
      case 'yes_no':
        return <CheckCircle size={16} />;
      case 'multiple_choice':
        return <Hash size={16} />;
      case 'ranked_choice':
        return <Hash size={16} />;
      default:
        return <CheckCircle size={16} />;
    }
  };

  const getVoteTypeLabel = () => {
    switch (vote.type) {
      case 'yes_no':
        return 'Yes/No';
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'ranked_choice':
        return 'Ranked Choice';
      default:
        return 'Yes/No';
    }
  };

  const renderResults = () => {
    if (!results || !Array.isArray(results) || results.length === 0) return null;

    if (vote.type === 'yes_no') {
      const yesVotes = results.filter((r: any) => r.choices?.answer === 'yes').length;
      const noVotes = results.filter((r: any) => r.choices?.answer === 'no').length;
      const total = yesVotes + noVotes;

      if (total === 0) return null;

      return (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-muted-foreground">Yes: <span className="font-semibold text-foreground">{yesVotes}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span className="text-muted-foreground">No: <span className="font-semibold text-foreground">{noVotes}</span></span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`hover-lift overflow-hidden ${hasVoted ? 'border-2 border-secondary' : ''}`} data-testid={`card-vote-${vote.id}`}>
      {hasVoted && (
        <div className="bg-secondary/10 px-4 py-2 flex items-center gap-2">
          <CheckCircle className="text-secondary" size={16} />
          <span className="text-sm font-medium text-secondary-foreground">You have voted</span>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {vote.status === 'active' ? 'Active' : vote.status}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                {getVoteTypeIcon()}
                {getVoteTypeLabel()}
              </Badge>
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-vote-title-${vote.id}`}>
              {vote.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-vote-description-${vote.id}`}>
              {vote.description || 'No description provided'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Closes in {timeRemaining}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                Created by {vote.creator?.firstName} {vote.creator?.lastName}
              </span>
            </div>
          </div>
        </div>
        
        {/* Participation Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Participation</span>
            <span className="text-xs font-semibold text-foreground">
              {totalVotes} / 42 members
            </span>
          </div>
          <Progress value={participationRate} className="h-2" />
        </div>
        
        {/* Voting Action */}
        {hasVoted ? (
          <div className="space-y-3">
            <Button variant="secondary" className="w-full" disabled data-testid={`button-voted-${vote.id}`}>
              Vote Submitted
            </Button>
            <Link href={`/results/${vote.id}`}>
              <Button variant="outline" className="w-full" data-testid={`button-view-results-${vote.id}`}>
                View Results
              </Button>
            </Link>
          </div>
        ) : (
          <Link href={`/vote/${vote.id}`}>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" data-testid={`button-vote-${vote.id}`}>
              Cast Your Vote
            </Button>
          </Link>
        )}
        
        {/* Quick Results Preview */}
        {vote.allowRealTimeResults && renderResults()}
      </CardContent>
    </Card>
  );
}
