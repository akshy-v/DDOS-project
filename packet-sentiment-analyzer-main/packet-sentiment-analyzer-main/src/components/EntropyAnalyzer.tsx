
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Activity, Save, FileUp, FileDown } from 'lucide-react';
import { Packet, calculateSourceIPEntropy, calculatePacketSizeEntropy, detectDDoSAttack, calculateAccuracy } from '../services/entropyService';
import { simulateDDoSScenario } from '../services/packetService';
import { storeDetectionResult, storeDetectionStats, exportPacketData, importPacketData } from '../services/apiService';
import PacketVisualizer from './PacketVisualizer';
import ResultsDisplay from './ResultsDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

interface EntropyData {
  index: number;
  ipEntropy: number;
  sizeEntropy: number;
  isAttack: boolean;
  detectedAttack: boolean;
}

const EntropyAnalyzer: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [baseline, setBaseline] = useState<Packet[]>([]);
  const [trafficData, setTrafficData] = useState<Packet[]>([]);
  const [currentWindow, setCurrentWindow] = useState<Packet[]>([]);
  const [entropyData, setEntropyData] = useState<EntropyData[]>([]);
  const [detectionResults, setDetectionResults] = useState<boolean[]>([]);
  const [baselineIPEntropy, setBaselineIPEntropy] = useState(0);
  const [baselineSizeEntropy, setBaselineSizeEntropy] = useState(0);
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    truePositives: 0,
    falsePositives: 0,
    trueNegatives: 0,
    falseNegatives: 0
  });
  const [uploadKey, setUploadKey] = useState(0); // To reset file input
  const { toast } = useToast();

  // Window size for analysis
  const WINDOW_SIZE = 50;
  
  // Initialize simulation data
  const initializeSimulation = useCallback(() => {
    const { baseline, trafficWithAttacks } = simulateDDoSScenario();
    setBaseline(baseline);
    setTrafficData(trafficWithAttacks);
    setCurrentWindow([]);
    setEntropyData([]);
    setDetectionResults([]);
    setProgress(0);
    
    // Calculate baseline entropy values
    const ipEntropy = calculateSourceIPEntropy(baseline);
    const sizeEntropy = calculatePacketSizeEntropy(baseline);
    setBaselineIPEntropy(ipEntropy);
    setBaselineSizeEntropy(sizeEntropy);
    
    // Reset metrics
    setMetrics({
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0
    });
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // Store results in the backend
  const storeResults = useCallback(async (data: EntropyData, metrics: any) => {
    try {
      // Store individual detection result
      await storeDetectionResult({
        timestamp: Date.now(),
        ipEntropy: data.ipEntropy,
        sizeEntropy: data.sizeEntropy,
        isAttack: data.isAttack,
        detectedAttack: data.detectedAttack
      });
      
      // Store updated metrics
      await storeDetectionStats(metrics);
    } catch (error) {
      console.error('Error storing detection results:', error);
    }
  }, []);

  // Process packet windows for entropy analysis
  const processNextWindow = useCallback(() => {
    if (!running) return;
    
    const currentProgress = Math.min(progress + 1, trafficData.length);
    setProgress(currentProgress);
    
    if (currentProgress >= trafficData.length) {
      setRunning(false);
      return;
    }
    
    // Get current packet and update window
    const newPacket = trafficData[currentProgress - 1];
    const newWindow = [...currentWindow, newPacket].slice(-WINDOW_SIZE);
    setCurrentWindow(newWindow);
    
    if (newWindow.length < 10) return; // Need minimum packets for meaningful analysis
    
    // Calculate current entropy values
    const ipEntropy = calculateSourceIPEntropy(newWindow);
    const sizeEntropy = calculatePacketSizeEntropy(newWindow);
    
    // Detect attack
    const isAttackDetected = detectDDoSAttack(
      newWindow, 
      baselineIPEntropy, 
      baselineSizeEntropy
    );
    
    // Record detection result
    const newDetectionResults = [...detectionResults, isAttackDetected];
    setDetectionResults(newDetectionResults);
    
    // Add to entropy data for visualization
    const newDataPoint: EntropyData = {
      index: currentProgress,
      ipEntropy,
      sizeEntropy,
      isAttack: !!newPacket.isAttack,
      detectedAttack: isAttackDetected
    };
    
    setEntropyData(prev => [...prev, newDataPoint]);
    
    // Calculate accuracy metrics
    if (currentProgress % 10 === 0) {
      const actualAttacks = trafficData.slice(0, currentProgress).map(p => !!p.isAttack);
      const detections = newDetectionResults.slice(-actualAttacks.length);
      
      const accuracyMetrics = calculateAccuracy(
        trafficData.slice(0, currentProgress),
        detections
      );
      
      setMetrics(accuracyMetrics);
      
      // Store results in backend
      storeResults(newDataPoint, accuracyMetrics);
    }
  }, [
    running, 
    progress, 
    trafficData, 
    currentWindow, 
    baselineIPEntropy, 
    baselineSizeEntropy, 
    detectionResults,
    storeResults
  ]);

  // Run simulation with proper timing
  useEffect(() => {
    if (!running) return;
    
    const timer = setTimeout(processNextWindow, 100 / speed);
    return () => clearTimeout(timer);
  }, [running, progress, processNextWindow, speed]);

  // Toggle simulation
  const toggleSimulation = () => {
    setRunning(!running);
  };

  // Reset simulation
  const resetSimulation = () => {
    setRunning(false);
    initializeSimulation();
  };

  // Export current data
  const exportData = () => {
    const dataStr = exportPacketData(trafficData);
    const dataUri = "data:text/json;charset=utf-8," + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ddos_simulation_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Data exported",
      description: "Simulation data has been exported successfully.",
    });
  };

  // Import data from file
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const importedData = importPacketData(jsonData);
        
        if (importedData.length > 0) {
          setTrafficData(importedData);
          setProgress(0);
          setCurrentWindow([]);
          setEntropyData([]);
          setDetectionResults([]);
          
          toast({
            title: "Data imported",
            description: `Imported ${importedData.length} packets successfully.`,
          });
        } else {
          toast({
            title: "Import failed",
            description: "No valid packet data found in the file.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast({
          title: "Import failed",
          description: "There was an error importing the data.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    setUploadKey(prev => prev + 1);
  };

  // Calculate the percentage of the simulation that's complete
  const completionPercent = (progress / (trafficData.length || 1)) * 100;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 glass-morphism rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">DDoS Detection Simulation</h2>
            <p className="text-sm text-muted-foreground">Using entropy to detect anomalies in network traffic</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/history">
              <Button size="sm" variant="outline" className="transition-all duration-300">
                <Activity className="mr-1 h-4 w-4" />
                History
              </Button>
            </Link>
            <Button
              size="sm"
              variant={running ? "destructive" : "default"}
              onClick={toggleSimulation}
              className="transition-all duration-300 ease-in-out"
            >
              {running ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={resetSimulation}
              disabled={running}
              className="transition-all duration-300"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground w-20">Speed: {speed.toFixed(1)}x</span>
            <Slider 
              value={[speed]} 
              min={0.5} 
              max={5} 
              step={0.5} 
              onValueChange={value => setSpeed(value[0])} 
              className="w-32" 
            />
          </div>
          
          <div className="flex-1 flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <Progress value={completionPercent} className="h-2" />
            <span className="text-sm text-muted-foreground w-16">{progress}/{trafficData.length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={exportData}
              disabled={trafficData.length === 0}
              className="transition-all duration-300"
            >
              <FileDown className="mr-1 h-4 w-4" />
              Export
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="transition-all duration-300"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={running}
            >
              <FileUp className="mr-1 h-4 w-4" />
              Import
            </Button>
            <input 
              type="file" 
              id="file-upload" 
              key={uploadKey}
              accept=".json"
              className="hidden" 
              onChange={importData}
            />
          </div>
        </div>
        
        <PacketVisualizer 
          packets={trafficData} 
          isRunning={running} 
          speed={speed} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 md:col-span-2 neo-morphism">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Entropy Analysis</h3>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={entropyData.slice(-100)}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ipEntropy" 
                    name="Source IP Entropy" 
                    stroke="#0070F3" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sizeEntropy" 
                    name="Packet Size Entropy" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
                <span>Source IP Entropy</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-[#10B981] mr-1"></div>
                <span>Packet Size Entropy</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ResultsDisplay metrics={metrics} />
      </div>
    </div>
  );
};

export default EntropyAnalyzer;
