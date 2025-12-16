// Normalized Euclidean distance scoring
export function comparePose(user, reference) {
  let total = 0;
  let count = 0;

  for (let i = 0; i < reference.length; i++) {
    const u = user[i];
    const r = reference[i];
    if (!u || !r) continue;

    const dx = u.x - r.x;
    const dy = u.y - r.y;

    total += Math.sqrt(dx * dx + dy * dy);
    count++;
  }

  if (count === 0) return 0;

  const avgError = total / count;

  // Convert distance → accuracy %
  const accuracy = Math.max(0, 100 - avgError * 300);
  return accuracy;
}

export function getFeedback(score) {
  if (score > 85) return { color: "GREEN", instruction: "Perfect form" };
  if (score > 60) return { color: "YELLOW", instruction: "Adjust slightly" };
  return { color: "RED", instruction: "Fix posture" };
}
