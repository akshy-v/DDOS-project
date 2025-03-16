
import React from 'react';
import Header from '@/components/Header';
import EntropyAnalyzer from '@/components/EntropyAnalyzer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <EntropyAnalyzer />
        
        <div className="glass-morphism rounded-lg p-6 mb-8 animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Understanding Entropy-Based DDoS Detection</h2>
          <div className="space-y-4 text-sm">
            <p>
              Entropy is a measure of randomness or unpredictability in a system. In network traffic analysis, 
              entropy can be calculated for various traffic attributes like source IP addresses, packet sizes, 
              or inter-arrival times.
            </p>
            <p>
              During normal network conditions, traffic typically exhibits higher entropy (more randomness) 
              in source IP distributions. During a DDoS attack, entropy often decreases as traffic patterns 
              become more uniform and predictable.
            </p>
            <p>
              This simulator demonstrates how changes in entropy can be used to effectively detect DDoS attacks
              in real-time. The system calculates Shannon entropy over sliding windows of traffic data and
              compares it against baseline measurements to identify anomalies.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container px-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Entropy DDoS Sentinel &copy; {new Date().getFullYear()}
          </div>
          <div className="text-sm text-muted-foreground">
            Built with precision and purpose
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
