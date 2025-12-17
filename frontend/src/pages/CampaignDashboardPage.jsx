import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardContent } from '@/components/DashboardContent';
import { useToast } from '@/hooks/use-toast';

export default function CampaignDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCampaign();
  }, [id]);
  
  const loadCampaign = async () => {
    try {
      const res = await fetch(`/api/attestation/campaigns/${id}`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) throw new Error('Failed to load campaign');
      
      const data = await res.json();
      setCampaign(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load campaign',
        variant: 'destructive'
      });
      navigate('/attestation');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/attestation')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
        
        <h1 className="text-2xl font-bold">{campaign?.name}</h1>
        
        <div className="w-32" /> {/* Spacer for balance */}
      </div>
      
      <DashboardContent campaign={campaign} compact={false} />
    </div>
  );
}
