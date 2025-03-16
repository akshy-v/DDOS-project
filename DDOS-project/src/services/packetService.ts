
import { Packet } from './entropyService';

// Generate random IP address
const generateRandomIP = (): string => {
  return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');
};

// Generate a single packet
export const generatePacket = (id: number, isAttack: boolean = false): Packet => {
  // During attack, most packets come from a small set of IPs
  const sourceIP = isAttack
    ? Array(5).fill(0).map(() => generateRandomIP())[id % 5]
    : generateRandomIP();
  
  // During attack, packet sizes are often uniform
  const size = isAttack
    ? 512 + Math.floor(Math.random() * 10) // Very uniform size during attack
    : 64 + Math.floor(Math.random() * 1400); // Variable size during normal traffic
  
  return {
    id,
    sourceIP,
    destinationIP: '192.168.1.1', // Target server
    timestamp: Date.now(),
    size,
    isAttack
  };
};

// Generate a batch of packets
export const generatePacketBatch = (
  count: number, 
  startId: number = 0,
  attackProbability: number = 0
): Packet[] => {
  return Array(count).fill(0).map((_, index) => {
    const isAttack = Math.random() < attackProbability;
    return generatePacket(startId + index, isAttack);
  });
};

// Simulate traffic with attack phases
export const simulateTraffic = (
  phases: Array<{
    packetCount: number,
    attackProbability: number
  }>
): Packet[] => {
  let allPackets: Packet[] = [];
  let currentId = 0;
  
  phases.forEach(phase => {
    const packets = generatePacketBatch(
      phase.packetCount,
      currentId,
      phase.attackProbability
    );
    allPackets = [...allPackets, ...packets];
    currentId += phase.packetCount;
  });
  
  return allPackets;
};

// Generate baseline normal traffic
export const generateBaselineTraffic = (packetCount: number = 100): Packet[] => {
  return generatePacketBatch(packetCount, 0, 0);
};

// Simulate a DDoS attack scenario with phases
export const simulateDDoSScenario = (): {
  baseline: Packet[],
  trafficWithAttacks: Packet[]
} => {
  // Generate baseline traffic (normal behavior)
  const baseline = generateBaselineTraffic(200);
  
  // Generate traffic with attack phases
  const trafficWithAttacks = simulateTraffic([
    { packetCount: 100, attackProbability: 0 },     // Normal traffic
    { packetCount: 150, attackProbability: 0.7 },   // Attack phase 1
    { packetCount: 50, attackProbability: 0 },      // Brief normal period
    { packetCount: 200, attackProbability: 0.9 },   // Attack phase 2
    { packetCount: 100, attackProbability: 0 }      // Return to normal
  ]);
  
  return { baseline, trafficWithAttacks };
};
