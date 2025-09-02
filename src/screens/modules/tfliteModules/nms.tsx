// nms.ts
// React Native TypeScript version based on types.tsx

import { BBox, Detection } from './types';

function overlapSimilarity(box1: BBox, box2: BBox): number {
  const intersection = box1.intersect(box2);
  if (!intersection) return 0.0;
  const intersectArea = intersection.area;
  const unionArea = box1.area + box2.area - intersectArea;
  return unionArea > 0.0 ? intersectArea / unionArea : 0.0;
}

export function nonMaximumSuppression(
  detections: Detection[],
  minSuppressionThreshold: number,
  minScore?: number,
  weighted: boolean = false
): Detection[] {
  const indexedScores: Array<[number, number]> = detections
    .map((d, i) => [i, d.score] as [number, number])
    .sort((a, b) => b[1] - a[1]);

  return weighted
    ? weightedNMS(indexedScores, detections, minSuppressionThreshold, minScore)
    : basicNMS(indexedScores, detections, minSuppressionThreshold, minScore);
}

function basicNMS(
  indexedScores: [number, number][],
  detections: Detection[],
  threshold: number,
  minScore?: number
): Detection[] {
  const keptBoxes: BBox[] = [];
  const results: Detection[] = [];

  for (const [index, score] of indexedScores) {
    if (minScore !== undefined && score < minScore) break;
    const det = detections[index];
    const bbox = det.bbox;

    const isSuppressed = keptBoxes.some(kept => overlapSimilarity(kept, bbox) > threshold);
    if (!isSuppressed) {
      results.push(det);
      keptBoxes.push(bbox);
    }
  }

  return results;
}

function weightedNMS(
  indexedScores: [number, number][],
  detections: Detection[],
  threshold: number,
  minScore?: number
): Detection[] {
  let remaining = [...indexedScores];
  const results: Detection[] = [];

  while (remaining.length) {
    const [leadIndex, leadScore] = remaining[0];
    const leadDet = detections[leadIndex];
    if (minScore !== undefined && leadDet.score < minScore) break;

    const leadBox = leadDet.bbox;
    const candidates: [number, number][] = [];
    const nextRemaining: [number, number][] = [];

    for (const [index, score] of remaining) {
      const sim = overlapSimilarity(leadBox, detections[index].bbox);
      if (sim > threshold) {
        candidates.push([index, score]);
      } else {
        nextRemaining.push([index, score]);
      }
    }

    if (candidates.length && leadDet.data) {
      const dim0 = leadDet.data.length;
      const dim1 = leadDet.data[0].length;
      const weighted: number[][] = Array.from({ length: dim0 }, () => Array(dim1).fill(0));
      let totalScore = 0;

      for (const [index, score] of candidates) {
        totalScore += score;
        const data = detections[index].data;
        if (data) {
          for (let i = 0; i < dim0; i++) {
            for (let j = 0; j < dim1; j++) {
              weighted[i][j] += data[i][j] * score;
            }
          }
        }
      }

      for (let i = 0; i < dim0; i++) {
        for (let j = 0; j < dim1; j++) {
          weighted[i][j] /= totalScore;
        }
      }

      results.push(new Detection(weighted, leadScore));
    } else {
      results.push(leadDet);
    }

    if (remaining.length === nextRemaining.length) break;
    remaining = nextRemaining;
  }

  return results;
}