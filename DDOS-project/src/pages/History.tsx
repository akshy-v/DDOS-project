
import React, { useEffect, useState } from 'react';
import { getDetectionHistory, clearDetectionHistory } from '../services/apiService';
import { Button } from '@/components/ui/button';
import { RotateCcw, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import Header from '@/components/Header';
import { formatInTimeZone } from 'date-fns-tz';

interface DetectionResult {
  timestamp: number;
  ipEntropy: number;
  sizeEntropy: number;
  isAttack: boolean;
  detectedAttack: boolean;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getDetectionHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error fetching history",
        description: "There was a problem loading the detection history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearDetectionHistory();
      setHistory([]);
      toast({
        title: "History cleared",
        description: "Detection history has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error clearing history",
        description: "There was a problem clearing the detection history.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format date from timestamp to Indian time
  const formatDate = (timestamp: number) => {
    return formatInTimeZone(
      new Date(timestamp),
      'Asia/Kolkata', 
      'yyyy-MM-dd HH:mm:ss (z)'
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      <div className="mb-6 glass-morphism rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Detection History</h2>
            <p className="text-sm text-muted-foreground">
              View past detection results from Supabase database (Indian Standard Time)
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleClearHistory}
              disabled={isLoading || history.length === 0}
            >
              Clear History
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Activity className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableCaption>
                {history.length === 0 
                  ? "No detection results available." 
                  : `Showing ${history.length} detection results.`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp (IST)</TableHead>
                  <TableHead>IP Entropy</TableHead>
                  <TableHead>Size Entropy</TableHead>
                  <TableHead>Actual Attack</TableHead>
                  <TableHead>Detected Attack</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(item.timestamp)}</TableCell>
                    <TableCell>{item.ipEntropy.toFixed(4)}</TableCell>
                    <TableCell>{item.sizeEntropy.toFixed(4)}</TableCell>
                    <TableCell>
                      <span className={item.isAttack ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {item.isAttack ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.detectedAttack ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {item.detectedAttack ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.isAttack === item.detectedAttack ? (
                        <span className="text-green-500 font-medium">Correct</span>
                      ) : (
                        <span className="text-destructive font-medium">Incorrect</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
