
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface MetricsProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

const ResultsDisplay: React.FC<{ metrics: MetricsProps }> = ({ metrics }) => {
  // Helper function to render a metric with appropriate formatting
  const renderMetric = (label: string, value: number, isPercentage: boolean = true) => {
    const displayValue = isPercentage 
      ? `${(value * 100).toFixed(1)}%` 
      : value.toString();
      
    return (
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-medium">{displayValue}</span>
      </div>
    );
  };

  // Determine overall performance rating
  const getPerformanceRating = () => {
    if (metrics.f1Score > 0.9) return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: "Excellent", color: "text-green-500" };
    if (metrics.f1Score > 0.7) return { icon: <CheckCircle className="h-5 w-5 text-blue-500" />, text: "Good", color: "text-blue-500" };
    if (metrics.f1Score > 0.5) return { icon: <AlertCircle className="h-5 w-5 text-amber-500" />, text: "Fair", color: "text-amber-500" };
    return { icon: <XCircle className="h-5 w-5 text-red-500" />, text: "Poor", color: "text-red-500" };
  };

  const performanceRating = getPerformanceRating();

  return (
    <Card className="neo-morphism">
      <CardContent className="p-4">
        <h3 className="font-medium mb-4">Detection Accuracy</h3>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Performance</span>
            <div className="flex items-center">
              {performanceRating.icon}
              <span className={`ml-1 ${performanceRating.color} font-medium`}>{performanceRating.text}</span>
            </div>
          </div>
          <div className="bg-secondary h-1 rounded-full mb-6">
            <div 
              className="bg-primary h-1 rounded-full transition-all duration-500"
              style={{ width: `${metrics.f1Score * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-4">
          {renderMetric("Accuracy", metrics.accuracy)}
          {renderMetric("Precision", metrics.precision)}
          {renderMetric("Recall", metrics.recall)}
          {renderMetric("F1 Score", metrics.f1Score)}
        </div>
        
        <h4 className="text-sm font-medium mb-2">Detection Breakdown</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-secondary/30 rounded p-2">
            <div className="text-muted-foreground mb-1">True Positives</div>
            <div className="font-medium">{metrics.truePositives}</div>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <div className="text-muted-foreground mb-1">False Positives</div>
            <div className="font-medium">{metrics.falsePositives}</div>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <div className="text-muted-foreground mb-1">True Negatives</div>
            <div className="font-medium">{metrics.trueNegatives}</div>
          </div>
          <div className="bg-secondary/30 rounded p-2">
            <div className="text-muted-foreground mb-1">False Negatives</div>
            <div className="font-medium">{metrics.falseNegatives}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
