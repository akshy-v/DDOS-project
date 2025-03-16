
// Entropy calculation service

// Type for the packet data
export interface Packet {
  id: number;
  sourceIP: string;
  destinationIP: string;
  timestamp: number;
  size: number;
  isAttack?: boolean;
}

// Calculate Shannon Entropy for a distribution
export const calculateShannon = (values: Record<string, number>): number => {
  const totalCount = Object.values(values).reduce((sum, count) => sum + count, 0);
  
  if (totalCount === 0) return 0;
  
  return -Object.values(values).reduce((entropy, count) => {
    if (count === 0) return entropy;
    const probability = count / totalCount;
    return entropy + probability * Math.log2(probability);
  }, 0);
};

// Calculate entropy based on source IP distribution
export const calculateSourceIPEntropy = (packets: Packet[]): number => {
  const sourceIPDistribution: Record<string, number> = {};
  
  // Count occurrences of each source IP
  packets.forEach(packet => {
    sourceIPDistribution[packet.sourceIP] = (sourceIPDistribution[packet.sourceIP] || 0) + 1;
  });
  
  return calculateShannon(sourceIPDistribution);
};

// Calculate entropy based on packet size distribution
export const calculatePacketSizeEntropy = (packets: Packet[]): number => {
  const packetSizeDistribution: Record<string, number> = {};
  
  // Group packet sizes into buckets (each 100 bytes)
  packets.forEach(packet => {
    const sizeBucket = Math.floor(packet.size / 100) * 100;
    const key = sizeBucket.toString();
    packetSizeDistribution[key] = (packetSizeDistribution[key] || 0) + 1;
  });
  
  return calculateShannon(packetSizeDistribution);
};

// Detect DDoS attack based on entropy thresholds
export const detectDDoSAttack = (
  packets: Packet[], 
  baselineIPEntropy: number,
  baselineSizeEntropy: number,
  ipThreshold = 0.8,
  sizeThreshold = 0.7
): boolean => {
  if (packets.length < 10) return false;
  
  const currentIPEntropy = calculateSourceIPEntropy(packets);
  const currentSizeEntropy = calculatePacketSizeEntropy(packets);
  
  // Significant drop in source IP entropy suggests DDoS (many packets from few sources)
  const ipEntropyRatio = currentIPEntropy / baselineIPEntropy;
  
  // Packet size entropy changes during attacks (often uniform size packets)
  const sizeEntropyRatio = currentSizeEntropy / baselineSizeEntropy;
  
  return ipEntropyRatio < ipThreshold || sizeEntropyRatio < sizeThreshold;
};

// Calculate detection accuracy (true positives, false positives, etc.)
export const calculateAccuracy = (
  packets: Packet[],
  detectedResults: boolean[]
): {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
} => {
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  
  packets.forEach((packet, index) => {
    const isAttack = !!packet.isAttack;
    const detectedAsAttack = detectedResults[index];
    
    if (isAttack && detectedAsAttack) truePositives++;
    else if (!isAttack && detectedAsAttack) falsePositives++;
    else if (!isAttack && !detectedAsAttack) trueNegatives++;
    else if (isAttack && !detectedAsAttack) falseNegatives++;
  });
  
  const accuracy = (truePositives + trueNegatives) / packets.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
  
  return {
    accuracy,
    precision, 
    recall,
    f1Score,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives
  };
};
