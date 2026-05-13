const PX = (id, w, h) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}`;

const PS = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const AV = (n) => `https://i.pravatar.cc/120?img=${n}`;

export const IMG = {
  // Products (Pexels — confirmed IDs)
  perfume:    PX(974964,  500, 600),
  lipstick:   PX(3059750, 500, 600),
  makeup:     PX(2113855, 500, 540),
  watch:      PX(190819,  500, 540),
  perfumeLg:  PX(974964,  600, 720),
  lipstickLg: PX(3059750, 600, 720),

  // Before/After — actual local image pairs (public folder)
  scenesBefore: '/AI%20Scenes%20Generation%20Images/Before.png',
  scenesAfter:  '/AI%20Scenes%20Generation%20Images/After.png',
  bgBefore:     '/AI%20Background%20Generation%20Images/Before.png',
  bgAfter:      '/AI%20Background%20Generation%20Images/After.png',

  // Hero section floating cards — local images
  hero1: '/Hero%20Section%20Imgaes/1.png',
  hero2: '/Hero%20Section%20Imgaes/2.png',
  hero3: '/Hero%20Section%20Imgaes/3.png',
  hero4: '/Hero%20Section%20Imgaes/4.png',

  // Scene library — local files from public/scenes/
  scene1: '/scenes/marble-surface.jpg',
  scene2: '/scenes/minimalist-stage.jpg',
  scene3: '/scenes/warm-podium.jpg',
  scene4: '/scenes/wooden-desk.jpg',
  scene5: '/scenes/beige-studio.jpg',
  scene6: '/scenes/marble-podium.jpg',
  scene7: '/scenes/summer-scene.jpg',
  scene8: '/scenes/forest-podium.jpg',

  // Showcase strip
  show1: PX(974964,  380, 460),
  show2: PX(3059750, 380, 460),
  show3: PX(2113855, 380, 460),
  show4: PX(190819,  380, 460),
  show5: PS('sunglasses-product', 380, 460),
  show6: PS('sneaker-shoe-white', 380, 460),
  show7: PS('leather-handbag',    380, 460),

  // Upcoming features
  batchImg:   PS('product-catalog-grid',   900, 320),
  tryonImg:   PS('fashion-shopping-woman', 900, 320),

  // Smart resize demo
  resizeDemo: PX(2113855, 900, 660),

  // Avatars (Pravatar)
  av1: AV(5), av2: AV(22), av3: AV(48), av4: AV(33),
  sarah: AV(47), marcus: AV(11), priya: AV(45),
};
