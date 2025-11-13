import RadialOrbitalTimeline from "../components/RadialOrbitalTimeline";
import { exampleTimelineData } from "../constants/timelineExampleData";

/**
 * Página de exemplo demonstrando o uso do componente RadialOrbitalTimeline
 * 
 * Para usar este componente em outra página:
 * 
 * 1. Importe o componente:
 *    import RadialOrbitalTimeline from "../components/RadialOrbitalTimeline";
 *    import { TimelineItem } from "../components/RadialOrbitalTimeline";
 * 
 * 2. Prepare seus dados no formato TimelineItem[]
 * 
 * 3. Use o componente:
 *    <RadialOrbitalTimeline timelineData={seusDados} />
 */
export default function TimelineExample() {
  return (
    <div className="w-full h-screen bg-black">
      <RadialOrbitalTimeline timelineData={exampleTimelineData} />
    </div>
  );
}

