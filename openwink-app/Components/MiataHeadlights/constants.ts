export const HEADLIGHT_COORDS = {
  // Left edge points
  leftTop: { x: 5, y: 8 },
  leftMid: { x: 0, y: 63 },
  leftBottom: { x: 5, y: 103 },
  leftBottomPanel: { x: 10, y: 103 },

  // Right edge points
  rightTop: { x: 110, y: 6 },
  rightTopClosed: { x: 124, y: 55 },
  rightMid: { x: 123, y: 63 },
  rightBottom: { x: 118, y: 95 },
  rightBottomPanel: { x: 118, y: 97 },

  // Inner junction points
  innerBottom: { x: 38, y: 99 },
  innerBottomPanel: { x: 25, y: 90 },

  // Fully open top positions
  topLeftOpen: { x: 0, y: 8 },
  topRightOpen: { x: 110, y: 0 },

  // Glow center
  glowCenter: { x: 60, y: 53 },
  glowCenterClosed: { y: 160 },
} as const;
